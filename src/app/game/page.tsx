"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSerial } from "../contexts/SerialContext";

// Types pour les données du jeu
interface GameData {
  status: number;
  gridSize?: number;
  ballSize?: number;
  ballX: number;
  ballY: number;
  ballDx: number;
  ballDy: number;
  paddleLeft: number;
  paddleLeftSize: number;
  paddleRight: number;
  paddleRightSize: number;
}

export default function GamePage() {
  const router = useRouter();
  const { isConnected, sendCommand, receivedData } = useSerial();
  
  // États du jeu
  const [scoreLeft, setScoreLeft] = useState(0);
  const [scoreRight, setScoreRight] = useState(0);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [leftPaddle, setLeftPaddle] = useState({ y: 50, size: 100 });
  const [rightPaddle, setRightPaddle] = useState({ y: 50, size: 100 });
  const [exchanges, setExchanges] = useState(0);
  const [gameTime, setGameTime] = useState("00:00");
  const [isPaused, setIsPaused] = useState(false);
  const [gameStatus, setGameStatus] = useState(0); // 0: en attente, 1: en cours, 2: pause, 3: terminé
  const [gameInitialized, setGameInitialized] = useState(false);
  
  // Variables de configuration du jeu
  const [gridSize, setGridSize] = useState(100);
  const [ballSize, setBallSize] = useState(2);
  
  // Référence pour le temps de départ
  const startTimeRef = useRef(Date.now());
  // Référence pour stocker les dernières données reçues
  const lastReceivedDataRef = useRef("");

  // Fonction pour parser les données de jeu
  const parseGameData = useCallback((dataStr: string): GameData | null => {
    try {
      if (dataStr.startsWith("game:all:")) {
        // Format: game:all:status,grid_size,ball_size,ball_x,ball_y,ball_dx,ball_dy,paddle_left,paddle_left_size,paddle_right,paddle_right_size
        const paramsStr = dataStr.substring("game:all:".length);
        const params = paramsStr.split(",").map(Number);
        
        if (params.length >= 11) {
          return {
            status: params[0],
            gridSize: params[1],
            ballSize: params[2],
            ballX: params[3],
            ballY: params[4],
            ballDx: params[5],
            ballDy: params[6],
            paddleLeft: params[7],
            paddleLeftSize: params[8],
            paddleRight: params[9],
            paddleRightSize: params[10]
          };
        }
      } else if (dataStr.startsWith("game:run:")) {
        // Format: game:run:status,ball_x,ball_y,ball_dx,ball_dy,paddle_left,paddle_left_size,paddle_right,paddle_right_size
        const paramsStr = dataStr.substring("game:run:".length);
        const params = paramsStr.split(",").map(Number);
        
        if (params.length >= 9) {
          return {
            status: params[0],
            ballX: params[1],
            ballY: params[2],
            ballDx: params[3],
            ballDy: params[4],
            paddleLeft: params[5],
            paddleLeftSize: params[6],
            paddleRight: params[7],
            paddleRightSize: params[8]
          };
        }
      }
    } catch (error) {
      console.error("Erreur de parsing des données:", error);
    }
    return null;
  }, []);

  // Fonction pour mettre à jour l'interface avec les données du jeu
  const updateGameInterface = useCallback((gameData: GameData) => {
    // Mise à jour du statut
    setGameStatus(gameData.status);
    
    // Si le jeu est terminé (status 3), traiter la fin de jeu
    if (gameData.status === 3) {
      // Déterminer le gagnant (celui qui a le plus de points)
      const winner = scoreLeft > scoreRight ? "Joueur 1" : (scoreRight > scoreLeft ? "Joueur 2" : "Match nul");
      endGame(winner);
      return;
    }
    
    // Mise à jour de isPaused basé sur le statut
    setIsPaused(gameData.status === 2);
    
    // Initialisation ou mise à jour des données de jeu
    if (gameData.gridSize !== undefined && gameData.ballSize !== undefined) {
      // C'est une initialisation (game:all)
      setGridSize(gameData.gridSize);
      setBallSize(gameData.ballSize);
      setGameInitialized(true);
    }
    
    // Calcul des positions relatives en pourcentage pour l'affichage
    const ballXPercent = (gameData.ballX / gridSize) * 100;
    const ballYPercent = (gameData.ballY / gridSize) * 100;
    
    // Mise à jour de la position de la balle
    setBallPosition({
      x: ballXPercent,
      y: ballYPercent
    });
    
    // Mise à jour de la position et taille des raquettes
    // La position en Y est en valeur absolue (0-100), la taille aussi
    setLeftPaddle({
      y: (gameData.paddleLeft / gridSize) * 100,
      size: gameData.paddleLeftSize
    });
    
    setRightPaddle({
      y: (gameData.paddleRight / gridSize) * 100,
      size: gameData.paddleRightSize
    });
    
    // Vérifier si un point a été marqué (quand la balle revient au centre)
    if (Math.abs(ballXPercent - 50) < 2 && Math.abs(ballYPercent - 50) < 2) {
      // Augmenter le nombre d'échanges
      setExchanges(prev => prev + 1);
      
      // Déterminer qui a marqué le point en fonction de la direction de la balle
      if (gameData.ballDx < 0) {
        // La balle va vers la gauche, donc le joueur de droite a marqué
        setScoreRight(prev => prev + 1);
      } else if (gameData.ballDx > 0) {
        // La balle va vers la droite, donc le joueur de gauche a marqué
        setScoreLeft(prev => prev + 1);
      }
    }
  }, [gridSize, scoreLeft, scoreRight]);

  // Écouter les données reçues du port série
  useEffect(() => {
    if (!receivedData || receivedData === lastReceivedDataRef.current) return;
    
    // Mettre à jour la référence
    lastReceivedDataRef.current = receivedData;
    
    // Traiter chaque ligne des données reçues
    const lines = receivedData.split("\r\n").filter(line => line.trim() !== "");
    
    // Prendre la dernière ligne qui correspond à un message de jeu
    const gameLines = lines.filter(line => line.startsWith("game:"));
    if (gameLines.length > 0) {
      const lastGameLine = gameLines[gameLines.length - 1];
      const gameData = parseGameData(lastGameLine);
      
      if (gameData) {
        updateGameInterface(gameData);
      }
    }
  }, [receivedData, parseGameData, updateGameInterface]);

  // Vérifier la connexion et initialiser le jeu
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!isConnected) {
      router.push("/connexion");
      return;
    }

    // Initialiser le temps de départ
    startTimeRef.current = Date.now();
    
    // Timer pour mettre à jour le temps de jeu
    const timer = setInterval(() => {
      if (!isPaused && gameStatus === 1) { // seulement si en cours de jeu
        const currentTime = Date.now();
        const durationMs = currentTime - startTimeRef.current;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        setGameTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [isConnected, router, isPaused, gameStatus]);

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
      sendCommand("game:stop");
    }
    
    // Naviguer vers la page de fin
    router.push("/finish");
  };

  // Fonction pour mettre le jeu en pause
  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    
    // En cas de reprise du jeu, on ajuste le temps de référence pour tenir compte de la pause
    if (!newPausedState) {
      // Ajuste startTimeRef pour qu'il prenne en compte le temps de pause
      const pauseOffset = Date.now() - startTimeRef.current;
      startTimeRef.current = Date.now() - pauseOffset;
    }
    
    if (isConnected) {
      sendCommand(newPausedState ? "game:pause" : "game:resume");
    }
  };

  // Afficher un écran de chargement si le jeu n'est pas encore initialisé
  if (!gameInitialized && isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 flex flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-cyan-500 rounded-full mb-4 shadow-[0_0_15px_rgba(6,182,212,0.7)]"></div>
          <p className="text-white text-xl">Initialisation du jeu...</p>
        </div>
      </div>
    );
  }

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
            width: `${ballSize * 2}px`,
            height: `${ballSize * 2}px`,
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
            height: `${leftPaddle.size}px`,
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
            height: `${rightPaddle.size}px`,
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