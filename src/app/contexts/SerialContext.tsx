"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

// Type pour les entrées de log
interface LogEntry {
  type: 'sent' | 'received';
  message: string;
  timestamp: string;
}

// Type pour le contexte
type SerialContextType = {
  isClient: boolean;
  isSerialSupported: boolean;
  isConnected: boolean;
  isLoading: boolean;
  errorMessage: string;
  baudRate: number;
  logs: LogEntry[];
  gameStatus: 'none' | 'running' | 'paused' | 'finished';
  receivedData: string;
  addLog: (entry: LogEntry) => void;
  setBaudRate: (rate: number) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendCommand: (cmd: string) => Promise<void>;
  clearLog: () => void;
};

// Valeur par défaut du contexte
const defaultContext: SerialContextType = {
  isClient: false,
  isSerialSupported: false,
  isConnected: false,
  isLoading: false,
  errorMessage: "",
  baudRate: 115200,
  logs: [],
  gameStatus: 'none',
  receivedData: "",
  addLog: () => {},
  setBaudRate: () => {},
  connect: async () => {},
  disconnect: async () => {},
  sendCommand: async () => {},
  clearLog: () => {},
};

// Création du contexte
const SerialContext = createContext<SerialContextType>(defaultContext);

// Props pour le provider
type SerialProviderProps = {
  children: ReactNode;
};

export const SerialProvider = ({ children }: SerialProviderProps) => {
  // Références pour les objets Serial
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const writerRef = useRef<any>(null);
  const previousReceivedData = useRef<string>('');
  
  // Référence pour suivre les tentatives de déconnexion
  const disconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Référence pour contrôler la boucle de lecture
  const readLoopActiveRef = useRef<boolean>(false);
  
  // Référence pour le timeout de sécurité
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // États
  const [isClient, setIsClient] = useState(false);
  const [isSerialSupported, setIsSerialSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [baudRate, setBaudRate] = useState(115200);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [buffer, setBuffer] = useState("");
  const [gameStatus, setGameStatus] = useState<'none' | 'running' | 'paused' | 'finished'>('none');
  const [receivedData, setReceivedData] = useState("");

  // Fonction pour ajouter un log
  const addLog = (entry: LogEntry) => {
    setLogs(prev => [...prev, entry]);
  };

  // Fonction pour formater l'horodatage
  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  };

  // Fonction pour traiter les données du jeu
  const processGameData = (message: string) => {
    if (message.startsWith('game:all:') || message.startsWith('game:run:')) {
      const parts = message.split(':')[2].split(',');
      const status = parseInt(parts[0]);
      
      switch (status) {
        case 0:
          setGameStatus('none');
          break;
        case 1:
          setGameStatus('running');
          break;
        case 2:
          setGameStatus('paused');
          break;
        case 3:
          setGameStatus('finished');
          break;
        default:
          console.warn('Statut de jeu inconnu:', status);
      }
    }
  };

  // Mettre à jour les logs quand on reçoit des données
  useEffect(() => {
    if (receivedData && receivedData !== previousReceivedData.current) {
      const newData = receivedData.substring(previousReceivedData.current.length);
      if (newData) {
        // Chercher toutes les lignes complètes dans le buffer + nouvelles données
        const lines = (buffer + newData).split(/\r\n|\n/);
        
        // S'il y a au moins une ligne complète
        if (lines.length > 1) {
          // Traiter toutes les lignes complètes sauf la dernière
          lines.slice(0, -1).forEach(line => {
            if (line.trim()) {
              // Ajouter aux logs
              addLog({
                type: 'received',
                message: line,
                timestamp: getTimestamp()
              });
              
              // Traiter les données du jeu si c'est un message de jeu
              processGameData(line);
            }
          });
          // Mettre à jour le buffer avec la dernière ligne incomplète
          setBuffer(lines[lines.length - 1]);
        } else {
          // Si pas de ligne complète, ajouter au buffer
          setBuffer(prev => prev + newData);
        }
      }
      previousReceivedData.current = receivedData;
    }
  }, [receivedData]);

  // Nettoyer le buffer et réinitialiser le statut du jeu à la déconnexion
  useEffect(() => {
    if (!isConnected) {
      setBuffer("");
      setGameStatus('none');
    }
  }, [isConnected]);

  // Vérifie si nous sommes côté client et si l'API Web Serial est supportée
  useEffect(() => {
    setIsClient(true);
    
    // Vérifie si l'API Web Serial est disponible
    const isSupported = typeof navigator !== 'undefined' && 'serial' in navigator;
    setIsSerialSupported(isSupported);
    
    // Récupère l'état de connexion du localStorage
    const savedConnection = localStorage.getItem("isConnected");
    if (savedConnection === "true") {
      // Tentative de reconnexion
      connect().catch(err => {
        console.error("Échec de la reconnexion automatique:", err);
      });
    }
    
    // Gestionnaire d'événement pour la fermeture de la page
    const handleBeforeUnload = () => {
      if (isConnected && portRef.current) {
        // Arrêter immédiatement la boucle de lecture
        readLoopActiveRef.current = false;
        
        // Tenter de déconnecter proprement
        try {
          if (readerRef.current) {
            readerRef.current.cancel();
            readerRef.current.releaseLock();
          }
          if (writerRef.current) {
            writerRef.current.close();
            writerRef.current.releaseLock();
          }
          portRef.current.close();
        } catch (error) {
          console.error("Erreur lors du nettoyage avant fermeture:", error);
        }
      }
    };
    
    // Ajouter l'écouteur d'événement
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Nettoyage lors de la fermeture de l'application
    return () => {
      // Supprimer l'écouteur d'événement
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Nettoyer la connexion
      if (portRef.current && isConnected) {
        // Arrêter la boucle de lecture
        readLoopActiveRef.current = false;
        
        disconnect().catch(err => {
          console.error("Erreur lors de la déconnexion:", err);
        });
      }
    };
  }, []);

  // Fonction pour lire les données en continu
  async function readLoop() {
    if (!readerRef.current) return;
    
    // Marquer la boucle comme active
    readLoopActiveRef.current = true;
    
    try {
      while (readLoopActiveRef.current && readerRef.current) {
        try {
          const { value, done } = await readerRef.current.read();
          if (done) {
            console.log("Lecture terminée");
            break;
          }
          if (value) {
            setReceivedData(prev => prev + value);
          }
        } catch (error) {
          if (readLoopActiveRef.current) {
            console.error("Erreur lors de la lecture du port:", error);
            setErrorMessage("Erreur lors de la lecture des données");
          } else {
            // Erreur probablement due à une déconnexion volontaire
            console.log("Interruption de lecture (probablement déconnexion intentionnelle)");
          }
          break;
        }
      }
    } finally {
      // S'assurer que la boucle est marquée comme inactive
      readLoopActiveRef.current = false;
    }
  }

  // Fonction utilitaire pour vérifier si le port est ouvert
  const isPortOpen = () => {
    try {
      return portRef.current && portRef.current.readable && portRef.current.writable;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'état du port:", error);
      return false;
    }
  };

  // Fonction pour une déconnexion forcée en cas de timeout
  const forceDisconnect = () => {
    console.warn("Déconnexion forcée après timeout");
    
    try {
      // Réinitialiser toutes les références et l'état
      readLoopActiveRef.current = false;
      
      if (readerRef.current) {
        try { readerRef.current.releaseLock(); } catch (e) {}
        readerRef.current = null;
      }
      
      if (writerRef.current) {
        try { writerRef.current.releaseLock(); } catch (e) {}
        writerRef.current = null;
      }
      
      portRef.current = null;
    } catch (e) {
      console.error("Erreur lors de la déconnexion forcée:", e);
    } finally {
      // Nettoyer l'état
      setIsConnected(false);
      setIsLoading(false);
      localStorage.setItem("isConnected", "false");
    }
  };

  // Fonction pour se connecter au port série
  const connect = async () => {
    // Réinitialiser tout timeout de sécurité existant
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }

    // Assurons-nous que la boucle de lecture précédente est arrêtée
    readLoopActiveRef.current = false;
    
    // Assurons-nous de nettoyer les anciennes connexions en cours
    if (disconnectTimeoutRef.current) {
      clearTimeout(disconnectTimeoutRef.current);
      disconnectTimeoutRef.current = null;
    }
    
    if (isConnected) {
      // Si déjà connecté, déconnectons d'abord
      await disconnect();
    }
    
    if (!isSerialSupported) return;
    
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      // Mettre en place un timeout de sécurité
      safetyTimeoutRef.current = setTimeout(() => {
        if (isLoading) {
          setErrorMessage("Timeout de connexion - opération annulée");
          forceDisconnect();
        }
      }, 10000); // 10 secondes timeout
      
      // Demande à l'utilisateur de sélectionner un port série
      portRef.current = await (navigator as any).serial.requestPort();
      
      // Ouvre le port avec le baudrate sélectionné
      await portRef.current.open({ 
        baudRate: baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none"
      });

      // Prépare la lecture des données
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = portRef.current.readable.pipeTo(textDecoder.writable);
      readerRef.current = textDecoder.readable.getReader();

      // Prépare l'écriture des données
      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(portRef.current.writable);
      writerRef.current = textEncoder.writable.getWriter();
      
      // Démarre la lecture en continu
      readLoop();
      
      // Met à jour l'état
      setIsConnected(true);
      localStorage.setItem("isConnected", "true");
    } catch (error: any) {
      console.error("Erreur lors de la connexion au port:", error);
      
      // Message d'erreur plus descriptif
      let errorMsg = "Impossible de se connecter au port série";
      if (error.message) {
        errorMsg += ": " + error.message;
      }
      
      if (error.message && error.message.includes("Failed to open serial port")) {
        errorMsg += ". Vérifiez que votre appareil est connecté et n'est pas utilisé par une autre application.";
      }
      
      setErrorMessage(errorMsg);
      
      // Ferme le port si une erreur survient après l'ouverture
      if (portRef.current) {
        try {
          await portRef.current.close();
        } catch (e) {
          console.error("Erreur lors de la fermeture du port après échec:", e);
        }
      }
    } finally {
      // Nettoyer le timeout de sécurité
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      setIsLoading(false);
    }
  };

  // Fonction pour se déconnecter du port série
  const disconnect = async () => {
    if (!portRef.current || !isConnected) return Promise.resolve();
    
    // Arrêter la boucle de lecture
    readLoopActiveRef.current = false;
    
    // Si un timeout de déconnexion est déjà en cours, l'annuler
    if (disconnectTimeoutRef.current) {
      clearTimeout(disconnectTimeoutRef.current);
      disconnectTimeoutRef.current = null;
    }
    
    // Réinitialiser tout timeout de sécurité existant et en créer un nouveau
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    
    // Mettre en place un timeout de sécurité pour la déconnexion
    safetyTimeoutRef.current = setTimeout(() => {
      if (isConnected || isLoading) {
        setErrorMessage("Timeout de déconnexion - opération forcée");
        forceDisconnect();
      }
    }, 5000); // 5 secondes timeout
    
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      // S'assurer que reader/writer existent avant de les utiliser
      if (readerRef.current) {
        try {
          // Annuler la lecture en cours
          await readerRef.current.cancel();
          // Libérer le lock du lecteur
          readerRef.current.releaseLock();
          readerRef.current = null;
        } catch (error) {
          console.error("Erreur lors de la libération du reader:", error);
        }
      }
      
      if (writerRef.current) {
        try {
          // Fermer l'écrivain proprement
          await writerRef.current.close();
          // Libérer le lock de l'écrivain
          writerRef.current.releaseLock();
          writerRef.current = null;
        } catch (error) {
          console.error("Erreur lors de la libération du writer:", error);
        }
      }
      
      // Vérifier si le port est toujours ouvert
      if (isPortOpen()) {
        // Fermer le port après un délai pour s'assurer que tout est bien terminé
        return new Promise<void>((resolve, reject) => {
          disconnectTimeoutRef.current = setTimeout(async () => {
            try {
              if (portRef.current) {
                await portRef.current.close().catch((e: Error) => console.error("Erreur à la fermeture du port:", e));
                portRef.current = null;
              }
            } catch (error) {
              console.error("Erreur lors de la fermeture du port:", error);
              reject(error);
            } finally {
              // Met à jour l'état
              setIsConnected(false);
              localStorage.setItem("isConnected", "false");
              setIsLoading(false);
              disconnectTimeoutRef.current = null;
              resolve();
            }
          }, 300);
        });
      } else {
        // Le port n'est pas ouvert, juste mettre à jour l'état
        setIsConnected(false);
        localStorage.setItem("isConnected", "false");
        setIsLoading(false);
        return Promise.resolve();
      }
    } catch (error: any) {
      console.error("Erreur lors de la déconnexion du port:", error);
      setErrorMessage("Erreur lors de la déconnexion: " + (error.message || ""));
      setIsLoading(false);
      return Promise.reject(error);
    } finally {
      // Nettoyer le timeout de sécurité
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
    }
  };

  // Fonction pour envoyer une commande
  const sendCommand = async (cmd: string) => {
    if (!writerRef.current || !isConnected || !cmd) return;
    
    try {
      // Ajouter le log avant l'envoi
      addLog({
        type: 'sent',
        message: cmd,
        timestamp: getTimestamp()
      });
      
      await writerRef.current.write(cmd + "\r\n");
      return Promise.resolve();
    } catch (error: any) {
      console.error("Erreur lors de l'envoi de la commande:", error);
      setErrorMessage("Erreur d'envoi: " + (error.message || ""));
      return Promise.reject(error);
    }
  };

  // Fonction pour effacer le log
  const clearLog = () => {
    setLogs([]);
    setReceivedData("");
  };

  // Valeur du contexte
  const value = {
    isClient,
    isSerialSupported,
    isConnected,
    isLoading,
    errorMessage,
    baudRate,
    logs,
    gameStatus,
    receivedData,
    addLog,
    setBaudRate,
    connect,
    disconnect,
    sendCommand,
    clearLog,
  };

  return (
    <SerialContext.Provider value={value}>
      {children}
    </SerialContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useSerial = () => useContext(SerialContext); 