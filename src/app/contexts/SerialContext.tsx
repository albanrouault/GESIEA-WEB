"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

// Type pour le contexte
type SerialContextType = {
  isClient: boolean;
  isSerialSupported: boolean;
  isConnected: boolean;
  isLoading: boolean;
  log: string;
  errorMessage: string;
  baudRate: number;
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
  log: "",
  errorMessage: "",
  baudRate: 115200,
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
  
  // États
  const [isClient, setIsClient] = useState(false);
  const [isSerialSupported, setIsSerialSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [log, setLog] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [baudRate, setBaudRate] = useState(115200);

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
    
    // Nettoyage lors de la fermeture de l'application
    return () => {
      if (portRef.current && isConnected) {
        disconnect().catch(err => {
          console.error("Erreur lors de la déconnexion:", err);
        });
      }
    };
  }, []);

  // Fonction pour lire les données en continu
  async function readLoop() {
    while (true) {
      try {
        const { value, done } = await readerRef.current.read();
        if (done) {
          console.log("Lecture terminée");
          break;
        }
        if (value) {
          setLog(prev => prev + value);
        }
      } catch (error) {
        console.error("Erreur lors de la lecture du port:", error);
        setErrorMessage("Erreur lors de la lecture des données");
        break;
      }
    }
  }

  // Fonction pour se connecter au port série
  const connect = async () => {
    if (!isSerialSupported) return;
    
    try {
      setIsLoading(true);
      setErrorMessage("");
      
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
      setIsLoading(false);
    }
  };

  // Fonction pour se déconnecter du port série
  const disconnect = async () => {
    if (!portRef.current || !isConnected) return;
    
    try {
      setIsLoading(true);
      
      // Arrête la lecture et ferme le port proprement
      if (readerRef.current) {
        await readerRef.current.cancel();
        await readerRef.current.releaseLock();
      }
      
      if (writerRef.current) {
        await writerRef.current.close();
        await writerRef.current.releaseLock();
      }
      
      await portRef.current.close();
      
      // Met à jour l'état
      setIsConnected(false);
      localStorage.setItem("isConnected", "false");
    } catch (error: any) {
      console.error("Erreur lors de la déconnexion du port:", error);
      setErrorMessage("Erreur lors de la déconnexion: " + (error.message || ""));
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour envoyer une commande
  const sendCommand = async (cmd: string) => {
    if (!writerRef.current || !isConnected || !cmd) return;
    
    try {
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
    setLog("");
  };

  // Valeur du contexte
  const value = {
    isClient,
    isSerialSupported,
    isConnected,
    isLoading,
    log,
    errorMessage,
    baudRate,
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