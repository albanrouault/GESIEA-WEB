"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSerial } from "../contexts/SerialContext";

export default function LaunchPage() {
  const router = useRouter();
  const [winPoints, setWinPoints] = useState(5);
  const [ballSpeed, setBallSpeed] = useState(5);
  const [ballSize, setBallSize] = useState(5);
  const [paddleSize, setPaddleSize] = useState(5);
  const [paddleSpeed, setPaddleSpeed] = useState(5);
  const [loading, setLoading] = useState(true);
  const { isConnected, sendCommand } = useSerial();
  
  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    if (!isConnected) {
      router.push("/connexion");
    } else {
      setLoading(false);
    }
  }, [isConnected, router]);

  // Retour à la page de connexion
  const backToConnection = () => {
    router.push("/connexion");
  };

  // Démarrage du jeu
  const handleLaunchGame = async () => {
    try {
      // Envoi de la trame formatée au STM32 avec le nouveau format
      await sendCommand(`game:play:${winPoints}:${ballSpeed}:${ballSize}:${paddleSpeed}:${paddleSize}`);
      
      // Stocker les paramètres pour le jeu
      localStorage.setItem("winPoints", winPoints.toString());
      localStorage.setItem("ballSpeed", ballSpeed.toString());
      localStorage.setItem("ballSize", ballSize.toString());
      localStorage.setItem("paddleSize", paddleSize.toString());
      localStorage.setItem("paddleSpeed", paddleSpeed.toString());
      
      // Naviguer vers la page de jeu
      router.push("/game");
    } catch (error) {
      console.error("Erreur lors du lancement du jeu:", error);
      alert("Une erreur est survenue lors du lancement du jeu. Vérifiez la connexion avec l'appareil.");
    }
  };
  
  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <div className="animate-ping w-16 h-16 mb-8 rounded-full bg-cyan-400 opacity-75"></div>
          <p className="text-white text-lg">Vérification de la connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-black bg-opacity-30 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white border-opacity-10">
        <h1 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-300">
          Configuration du jeu
        </h1>
        
        {!isConnected && (
          <div className="mb-8 p-4 bg-red-900 bg-opacity-50 border border-red-500 text-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p className="font-medium">Connexion perdue</p>
                <p className="text-sm mt-1">Veuillez retourner à la page de connexion.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 1. Bouton pour lancer le jeu */}
        <div className="mb-8">
          <button 
            onClick={handleLaunchGame}
            disabled={!isConnected}
            className={`w-full py-4 px-6 rounded-lg flex items-center justify-center ${!isConnected ? 'bg-opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all'} text-white shadow-lg text-lg font-bold`}
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Lancer le jeu
          </button>
        </div>
        
        {/* 2. Points gagnants (nouveau curseur) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-lg">Points gagnants</label>
            <span className="text-amber-400 text-xl font-bold">{winPoints}</span>
          </div>
          <div className="bg-black bg-opacity-50 h-2 rounded-full">
            <div 
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full relative"
              style={{ width: `${winPoints * 10}%` }}
            >
              <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full shadow transform translate-x-1/2 -translate-y-1/4"></div>
            </div>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={winPoints} 
            onChange={(e) => setWinPoints(Number(e.target.value))} 
            className="w-full appearance-none opacity-0 absolute cursor-pointer"
            style={{margin: 0, height: '8px', top: 'auto'}}
            disabled={!isConnected}
          />
          <div className="flex justify-between text-gray-400 text-xs mt-1">
            <span>1 point</span>
            <span>10 points</span>
          </div>
        </div>
        
        {/* 3. Vitesse de la balle (ordre modifié) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-lg">Vitesse de la balle</label>
            <span className="text-cyan-400 text-xl font-bold">{ballSpeed}</span>
          </div>
          <div className="bg-black bg-opacity-50 h-2 rounded-full">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full relative"
              style={{ width: `${ballSpeed * 10}%` }}
            >
              <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full shadow transform translate-x-1/2 -translate-y-1/4"></div>
            </div>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={ballSpeed} 
            onChange={(e) => setBallSpeed(Number(e.target.value))} 
            className="w-full appearance-none opacity-0 absolute cursor-pointer"
            style={{margin: 0, height: '8px', top: 'auto'}}
            disabled={!isConnected}
          />
          <div className="flex justify-between text-gray-400 text-xs mt-1">
            <span>Lent</span>
            <span>Rapide</span>
          </div>
        </div>
        
        {/* 4. Taille de la balle (nouveau curseur) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-lg">Taille de la balle</label>
            <span className="text-green-400 text-xl font-bold">{ballSize}</span>
          </div>
          <div className="bg-black bg-opacity-50 h-2 rounded-full">
            <div 
              className="bg-gradient-to-r from-green-400 to-teal-500 h-full rounded-full relative"
              style={{ width: `${ballSize * 10}%` }}
            >
              <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full shadow transform translate-x-1/2 -translate-y-1/4"></div>
            </div>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={ballSize} 
            onChange={(e) => setBallSize(Number(e.target.value))} 
            className="w-full appearance-none opacity-0 absolute cursor-pointer"
            style={{margin: 0, height: '8px', top: 'auto'}}
            disabled={!isConnected}
          />
          <div className="flex justify-between text-gray-400 text-xs mt-1">
            <span>Petite</span>
            <span>Grande</span>
          </div>
        </div>
        
        {/* 5. Vitesse des raquettes */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-lg">Vitesse des raquettes</label>
            <span className="text-rose-400 text-xl font-bold">{paddleSpeed}</span>
          </div>
          <div className="bg-black bg-opacity-50 h-2 rounded-full">
            <div 
              className="bg-gradient-to-r from-rose-400 to-pink-500 h-full rounded-full relative"
              style={{ width: `${paddleSpeed * 10}%` }}
            >
              <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full shadow transform translate-x-1/2 -translate-y-1/4"></div>
            </div>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={paddleSpeed} 
            onChange={(e) => setPaddleSpeed(Number(e.target.value))} 
            className="w-full appearance-none opacity-0 absolute cursor-pointer"
            style={{margin: 0, height: '8px', top: 'auto'}}
            disabled={!isConnected}
          />
          <div className="flex justify-between text-gray-400 text-xs mt-1">
            <span>Lente</span>
            <span>Rapide</span>
          </div>
        </div>
        
        {/* 6. Taille des raquettes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-lg">Taille des raquettes</label>
            <span className="text-purple-400 text-xl font-bold">{paddleSize}</span>
          </div>
          <div className="bg-black bg-opacity-50 h-2 rounded-full">
            <div 
              className="bg-gradient-to-r from-purple-400 to-indigo-500 h-full rounded-full relative"
              style={{ width: `${paddleSize * 10}%` }}
            >
              <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full shadow transform translate-x-1/2 -translate-y-1/4"></div>
            </div>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={paddleSize} 
            onChange={(e) => setPaddleSize(Number(e.target.value))} 
            className="w-full appearance-none opacity-0 absolute cursor-pointer"
            style={{margin: 0, height: '8px', top: 'auto'}}
            disabled={!isConnected}
          />
          <div className="flex justify-between text-gray-400 text-xs mt-1">
            <span>Petite</span>
            <span>Grande</span>
          </div>
        </div>
        
        {/* 7. Bouton retour */}
        <div>
          <button 
            onClick={backToConnection}
            className="w-full py-3 px-6 rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Retour
          </button>
        </div>
      </div>
    </div>
  );
} 