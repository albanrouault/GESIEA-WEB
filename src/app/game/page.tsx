"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSerial } from "../contexts/SerialContext";

export default function GamePage() {
  const router = useRouter();
  const { isConnected, sendCommand } = useSerial();
  // États simulant les positions et scores
  const [scoreLeft, setScoreLeft] = useState(0);
  const [scoreRight, setScoreRight] = useState(0);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [leftPaddle, setLeftPaddle] = useState({ y: 50 });
  const [rightPaddle, setRightPaddle] = useState({ y: 50 });
  const [exchanges, setExchanges] = useState(0);
  const [gameTime, setGameTime] = useState("00:00");
  const [isPaused, setIsPaused] = useState(false);
  
  // Utiliser useRef pour stocker la valeur de startTime qui ne provoque pas de re-render
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!isConnected) {
      router.push("/connexion");
      return;
    }

    // Initialiser le jeu au premier rendu seulement (pas à chaque mise à jour)
    // startTimeRef est déjà initialisé en dehors du useEffect
    
    // Timer pour mettre à jour le temps de jeu
    const timer = setInterval(() => {
      if (!isPaused) {
        const currentTime = Date.now();
        const durationMs = currentTime - startTimeRef.current;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        setGameTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    
    // Cette fonction simule la fin du jeu après un délai
    // Dans une implémentation réelle, ce serait basé sur les données reçues du STM32
    const gameTimer = setTimeout(() => {
      endGame("Joueur 1");
    }, 30000); // Fin du jeu après 30 secondes (à remplacer par logique réelle)
    
    return () => {
      clearInterval(timer);
      clearTimeout(gameTimer);
    };
  }, [isConnected, router, isPaused]); // Retiré startTime des dépendances

  // Fonction pour terminer le jeu et naviguer vers la page de fin
  const endGame = (winner: string) => {
    // Calculer la durée du jeu
    const endTime = Date.now();
    const durationMs = endTime - startTimeRef.current;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    const duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Sauvegarder les résultats dans localStorage pour la page de fin
    localStorage.setItem("winner", winner);
    localStorage.setItem("duration", duration);
    localStorage.setItem("exchanges", exchanges.toString());
    localStorage.setItem("finalScore", `${scoreLeft}-${scoreRight}`);
    
    // Envoyer la commande de fin de jeu au STM32
    if (isConnected) {
      sendCommand("END_GAME");
    }
    
    // Naviguer vers la page de fin
    router.push("/finish");
  };

  // Fonction pour mettre le jeu en pause
  const togglePause = () => {
    // En cas de reprise du jeu, on ajuste le temps de référence pour tenir compte de la pause
    if (isPaused) {
      // Ajuste startTimeRef pour qu'il prenne en compte le temps de pause
      const pauseOffset = Date.now() - startTimeRef.current;
      startTimeRef.current = Date.now() - pauseOffset;
    }
    
    setIsPaused(!isPaused);
    if (isConnected) {
      sendCommand(isPaused ? "RESUME_GAME" : "PAUSE_GAME");
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 overflow-hidden flex flex-col justify-center items-center">
      {/* Overlay de particules pour donner une texture au fond */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
      </div>
      
      {/* Barre d'information supérieure */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10">
        <div className="bg-black bg-opacity-50 backdrop-blur-sm px-6 py-2 rounded-lg flex items-center">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-white font-mono">{gameTime}</span>
          </div>
        </div>
        
        <button 
          onClick={togglePause} 
          className="bg-black bg-opacity-50 backdrop-blur-sm p-2 rounded-lg hover:bg-opacity-70 transition-all"
        >
          {isPaused ? (
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          ) : (
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          )}
        </button>
      </div>
      
      {/* Zone de jeu */}
      <div className="relative w-full max-w-5xl h-[80vh] border-4 border-cyan-500 bg-black bg-opacity-30 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.5)]">
        {/* Scores */}
        <div className="absolute top-4 left-1/3 transform -translate-x-1/2 text-6xl font-bold text-white font-mono">{scoreLeft}</div>
        <div className="absolute top-4 right-1/3 transform translate-x-1/2 text-6xl font-bold text-white font-mono">{scoreRight}</div>

        {/* Barre centrale */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-full w-0.5 border-l-2 border-dashed border-white opacity-50"></div>

        {/* Balle avec effet glow */}
        <div
          className="absolute bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse"
          style={{
            width: "20px",
            height: "20px",
            left: `${ballPosition.x}%`,
            top: `${ballPosition.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        ></div>

        {/* Raquette gauche avec effet glow */}
        <div
          className="absolute bg-gradient-to-b from-blue-400 to-cyan-600 rounded shadow-[0_0_10px_rgba(6,182,212,0.7)]"
          style={{
            width: "12px",
            height: "100px",
            left: "20px",
            top: `${leftPaddle.y}%`,
            transform: "translateY(-50%)",
          }}
        ></div>

        {/* Raquette droite avec effet glow */}
        <div
          className="absolute bg-gradient-to-b from-rose-400 to-pink-600 rounded shadow-[0_0_10px_rgba(244,114,182,0.7)]"
          style={{
            width: "12px",
            height: "100px",
            right: "20px",
            top: `${rightPaddle.y}%`,
            transform: "translateY(-50%)",
          }}
        ></div>
        
        {/* Indicateur des joueurs */}
        <div className="absolute bottom-4 left-1/3 transform -translate-x-1/2 text-blue-400 font-bold">Joueur 1</div>
        <div className="absolute bottom-4 right-1/3 transform translate-x-1/2 text-pink-400 font-bold">Joueur 2</div>
      </div>
      
      {/* Bouton de fin de partie */}
      <button 
        onClick={() => endGame("Abandon")}
        className="absolute bottom-6 mx-auto mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        Terminer la partie
      </button>
      
      {/* Overlay de pause */}
      {isPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
          <div className="bg-black bg-opacity-80 p-8 rounded-xl border border-cyan-500 shadow-lg flex flex-col items-center">
            <svg className="w-16 h-16 text-cyan-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h2 className="text-3xl font-bold text-white mb-4">Jeu en pause</h2>
            <button 
              onClick={togglePause}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Reprendre
            </button>
          </div>
        </div>
      )}
      
      {/* Styles pour les étoiles */}
      <style jsx>{`
        .stars {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
                            radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
                            radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0)),
                            radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 200px 200px;
          animation: stars 3s linear infinite;
          opacity: 0.3;
        }
        
        @keyframes stars {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(200px);
          }
        }
      `}</style>
    </div>
  );
} 