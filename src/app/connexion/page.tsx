"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSerial } from "../contexts/SerialContext";

export default function ConnexionPage() {
  const router = useRouter();
  const [command, setCommand] = useState("");
  const { connect, disconnect, sendCommand, isConnected, receivedData, errorMessage } = useSerial();
  
  // Gérer la sélection du port
  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Erreur de connexion:", error);
    }
  };
  
  // Déconnecter du port série
  const handleDisconnect = () => {
    disconnect();
  };
  
  // Gérer l'appui sur Enter dans le champ de commande
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSendCommand();
    }
  };
  
  // Envoyer une commande au port série
  const handleSendCommand = async () => {
    if (command.trim() !== "" && isConnected) {
      await sendCommand(command);
      setCommand("");
    }
  };
  
  // Fonction pour continuer vers la page de configuration
  const continueToConfig = () => {
    router.push("/launch");
  };

  return (
    <div className="w-full h-screen p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">Contrôle du Port Série via le Navigateur</h1>
      
      {errorMessage && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}
      
      <div className="flex flex-col mb-4">
        <div className="mb-4 flex gap-2">
          <button 
            onClick={handleConnect}
            disabled={isConnected}
            className={`px-4 py-2 rounded ${isConnected ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            Connecter au port série
          </button>
          
          <button 
            onClick={handleDisconnect}
            disabled={!isConnected}
            className={`px-4 py-2 rounded ${!isConnected ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
          >
            Déconnecter
          </button>
          
          {isConnected && (
            <button 
              onClick={continueToConfig}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Continuer vers le jeu
            </button>
          )}
        </div>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Commande (ex: START, STOP)"
            className="flex-grow p-2 border rounded"
            disabled={!isConnected}
          />
          
          <button
            onClick={handleSendCommand}
            disabled={!isConnected || !command.trim()}
            className={`px-4 py-2 rounded ${!isConnected || !command.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            Envoyer
          </button>
        </div>
        
        <div className="border rounded p-2 bg-gray-50 h-64 overflow-auto font-mono text-sm">
          <h2 className="font-bold text-gray-700 mb-1">Données reçues:</h2>
          <pre className="whitespace-pre-wrap">
            {receivedData || "Aucune donnée reçue"}
          </pre>
        </div>
      </div>
      
      <div className="mb-4 p-2 bg-gray-100 border-l-4 border-gray-500 text-gray-700 text-sm">
        <p>
          <strong>État:</strong> {isConnected ? "Connecté" : "Déconnecté"}
        </p>
      </div>
      
      {errorMessage && errorMessage.includes("Failed to open serial port") && (
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <h3 className="font-bold">Conseils de dépannage :</h3>
          <ul className="list-disc pl-5 mt-2">
            <li>Vérifiez que votre appareil STM32 est bien connecté à l'ordinateur</li>
            <li>Fermez tout autre programme qui pourrait utiliser ce port série</li>
            <li>Essayez de débrancher et rebrancher l'appareil</li>
            <li>Essayez différentes vitesses de communication (baud rates)</li>
            <li>Vérifiez si le pilote du port série est correctement installé</li>
            <li>Assurez-vous que le firmware de votre STM32 est compatible avec la communication série</li>
            <li>Vérifiez dans le Gestionnaire de périphériques Windows que le port COM est bien reconnu</li>
          </ul>
        </div>
      )}
    </div>
  );
} 