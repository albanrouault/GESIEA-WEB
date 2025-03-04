"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSerial } from "./contexts/SerialContext";

const ConnexionPage = () => {
  const router = useRouter();
  const [command, setCommand] = useState("");
  
  // Utilisation du contexte serial
  const { 
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
  } = useSerial();

  // Gestion de la touche Entrée pour envoyer la commande
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSendCommand();
    }
  };

  // Envoyer une commande
  const handleSendCommand = async () => {
    if (command) {
      await sendCommand(command);
      setCommand("");
    }
  };

  // Fonction pour continuer vers la page de configuration
  const continueToConfig = () => {
    router.push("/launchPage");
  };

  return (
    <div className="w-full h-screen p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">Contrôle du Port Série via le Navigateur</h1>
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      {isClient && !isSerialSupported && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>L'API Web Serial n'est pas supportée par votre navigateur.</p>
          <p>Utilisez Chrome, Edge ou Opera pour accéder à cette fonctionnalité.</p>
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Vitesse de communication (baud rate)</label>
        <select
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={baudRate}
          onChange={(e) => setBaudRate(Number(e.target.value))}
          disabled={isConnected}
        >
          <option value="9600">9600</option>
          <option value="19200">19200</option>
          <option value="38400">38400</option>
          <option value="57600">57600</option>
          <option value="115200">115200</option>
        </select>
      </div>
      
      <div className="mb-4">
        <button 
          className="px-4 py-2 mr-2 bg-blue-500 text-white rounded disabled:bg-gray-300 relative"
          onClick={connect}
          disabled={!isClient || !isSerialSupported || isConnected || isLoading}
        >
          {isLoading ? (
            <>
              <span className="opacity-0">Se connecter au port série</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            </>
          ) : (
            "Se connecter au port série"
          )}
        </button>
        
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
          onClick={disconnect}
          disabled={!isConnected || isLoading}
        >
          Se déconnecter du port série
        </button>
      </div>
      
      <textarea 
        className="w-full h-36 p-2 border border-gray-300 rounded mb-4"
        value={log}
        readOnly
      />
      
      <div className="flex mb-4">
        <input 
          type="text" 
          className="flex-grow p-2 border border-gray-300 rounded-l"
          placeholder="Commande à envoyer au port"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isConnected}
        />
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded-r disabled:bg-gray-300"
          onClick={handleSendCommand}
          disabled={!isConnected}
        >
          Envoyer au port
        </button>
      </div>
      
      <div className="font-bold mb-6">
        {isConnected ? "Statut port : Connecté" : "Statut port : Déconnecté"}
      </div>
      
      {isConnected && (
        <button 
          className="w-full px-4 py-3 bg-blue-600 text-white rounded"
          onClick={continueToConfig}
        >
          Continuer vers la page de configuration
        </button>
      )}
      
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
};

export default ConnexionPage; 