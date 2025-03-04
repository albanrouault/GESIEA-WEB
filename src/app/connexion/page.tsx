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
    try {
      // Utiliser une fonction async immédiatement invoquée pour gérer la promesse
      (async () => {
        try {
          // Attendre que la déconnexion soit terminée
          await disconnect().catch(error => {
            console.error("Erreur lors de la déconnexion (capturée par catch):", error);
          });
          console.log("Déconnexion terminée");
        } catch (error) {
          console.error("Erreur lors de la déconnexion (capturée par try/catch):", error);
        }
      })();
    } catch (error) {
      console.error("Erreur inattendue lors de la déconnexion:", error);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 text-white flex flex-col items-center p-6">
      <div className="max-w-3xl w-full bg-black bg-opacity-30 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white border-opacity-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-300">
            GESIEA Console
          </h1>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse mr-2`}></div>
            <span className="text-sm">{isConnected ? "Connecté" : "Déconnecté"}</span>
          </div>
        </div>
        
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-900 bg-opacity-50 border border-red-500 text-red-200 rounded-lg shadow-inner">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <button 
            onClick={handleConnect}
            disabled={isConnected}
            className={`${isConnected ? 'bg-opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 hover:scale-105 transform transition'} bg-blue-700 py-3 px-4 rounded-lg shadow-lg flex items-center justify-center`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            Connecter
          </button>
          
          <button 
            onClick={handleDisconnect}
            disabled={!isConnected}
            className={`${!isConnected ? 'bg-opacity-50 cursor-not-allowed' : 'hover:bg-rose-600 hover:scale-105 transform transition'} bg-rose-700 py-3 px-4 rounded-lg shadow-lg flex items-center justify-center`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Déconnecter
          </button>
          
          {isConnected && (
            <button 
              onClick={continueToConfig}
              className="bg-emerald-600 hover:bg-emerald-500 py-3 px-4 rounded-lg shadow-lg hover:scale-105 transform transition flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
              Configurer le jeu
            </button>
          )}
        </div>
        
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Saisir une commande..."
              className="flex-grow py-3 px-4 rounded-lg shadow-inner bg-black bg-opacity-60 border border-gray-700 focus:border-cyan-400 focus:outline-none text-gray-200 placeholder-gray-500"
              disabled={!isConnected}
            />
            
            <button
              onClick={handleSendCommand}
              disabled={!isConnected || !command.trim()}
              className={`${!isConnected || !command.trim() ? 'bg-opacity-50 cursor-not-allowed' : 'hover:bg-cyan-600 hover:scale-105 transform transition'} bg-cyan-700 py-3 px-4 rounded-lg shadow-lg flex items-center justify-center`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="border border-indigo-800 rounded-lg shadow-inner bg-black bg-opacity-70 p-4 h-72 overflow-auto font-mono text-sm relative">
          <div className="absolute top-0 left-0 w-full py-2 px-4 bg-indigo-900 bg-opacity-70 flex items-center rounded-t-lg">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-xs text-gray-300">Serial Monitor</span>
          </div>
          <div className="pt-8 pb-2 px-2">
            <pre className="whitespace-pre-wrap text-cyan-400">
              {receivedData || "// En attente de données..."}
            </pre>
          </div>
        </div>
      </div>
      
      {errorMessage && errorMessage.includes("Failed to open serial port") && (
        <div className="max-w-3xl w-full mt-8 bg-black bg-opacity-30 backdrop-blur-md rounded-xl shadow-xl p-6 border border-yellow-600 border-opacity-30">
          <h3 className="font-bold text-yellow-400 flex items-center mb-3">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Aide au dépannage
          </h3>
          <ul className="space-y-2 text-yellow-200 text-sm">
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-1 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Vérifiez que votre appareil STM32 est correctement connecté
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-1 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Fermez les applications qui pourraient utiliser le port série
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-1 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Essayez de débrancher puis rebrancher l'appareil
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-1 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Vérifiez les pilotes dans le Gestionnaire de périphériques
            </li>
          </ul>
        </div>
      )}
    </div>
  );
} 