"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSerial } from "./contexts/SerialContext";

const LaunchPage = () => {
  const router = useRouter();
  const [ballSpeed, setBallSpeed] = useState(5);
  const [paddleSpeed, setPaddleSpeed] = useState(5);
  const [loading, setLoading] = useState(true);
  
  // Utilisation du contexte serial
  const { isConnected, sendCommand } = useSerial();

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    if (!isConnected) {
      // Rediriger vers la page de connexion si non connecté
      router.push("/connexionPage");
    } else {
      setLoading(false);
    }
  }, [isConnected, router]);

  // Retour à la page de connexion
  const backToConnection = () => {
    router.push("/connexionPage");
  };

  // Démarrage du jeu
  const handleLaunchGame = async () => {
    try {
      // Envoi des paramètres à l'appareil STM32
      await sendCommand(`SET_BALL_SPEED:${ballSpeed}`);
      await sendCommand(`SET_PADDLE_SPEED:${paddleSpeed}`);
      await sendCommand("START_GAME");
      
      // Stocker les paramètres pour le jeu
      localStorage.setItem("ballSpeed", ballSpeed.toString());
      localStorage.setItem("paddleSpeed", paddleSpeed.toString());
      
      // Naviguer vers la page de jeu
      router.push("/gamePage");
    } catch (error) {
      console.error("Erreur lors du lancement du jeu:", error);
      alert("Une erreur est survenue lors du lancement du jeu. Vérifiez la connexion avec l'appareil.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Vérification de la connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Configuration du jeu</h1>
        
        {!isConnected && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Vous n'êtes pas connecté à l'appareil STM32.</p>
            <p>Veuillez retourner à la page de connexion.</p>
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Vitesse de la balle</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={ballSpeed} 
            onChange={(e) => setBallSpeed(Number(e.target.value))} 
            className="w-full"
            disabled={!isConnected}
          />
          <div className="flex justify-between text-gray-500 text-sm">
            <span>Lent</span>
            <span>Valeur: {ballSpeed}</span>
            <span>Rapide</span>
          </div>
        </div>
        
        <div className="mb-8">
          <label className="block text-gray-700 mb-2">Vitesse de la raquette</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={paddleSpeed} 
            onChange={(e) => setPaddleSpeed(Number(e.target.value))} 
            className="w-full"
            disabled={!isConnected}
          />
          <div className="flex justify-between text-gray-500 text-sm">
            <span>Lent</span>
            <span>Valeur: {paddleSpeed}</span>
            <span>Rapide</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleLaunchGame}
            className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-md transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!isConnected}
          >
            Lancer le jeu
          </button>
          
          <button
            onClick={backToConnection}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200"
          >
            Retour à la page de connexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaunchPage;
