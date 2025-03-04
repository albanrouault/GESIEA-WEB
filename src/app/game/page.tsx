"use client";

import React, { useState, useEffect } from "react";
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
  const [startTime, setStartTime] = useState(Date.now());
  const [exchanges, setExchanges] = useState(0);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!isConnected) {
      router.push("/connexion");
      return;
    }

    // Initialiser le jeu
    setStartTime(Date.now());
    
    // Cette fonction simule la fin du jeu après un délai
    // Dans une implémentation réelle, ce serait basé sur les données reçues du STM32
    const gameTimer = setTimeout(() => {
      endGame("Joueur");
    }, 30000); // Fin du jeu après 30 secondes (à remplacer par logique réelle)
    
    return () => clearTimeout(gameTimer);
  }, [isConnected, router]);

  // Fonction pour terminer le jeu et naviguer vers la page de fin
  const endGame = (winner: string) => {
    // Calculer la durée du jeu
    const endTime = Date.now();
    const durationMs = endTime - startTime;
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

  return (
    <div className="relative w-full h-screen bg-gray-200 dark:bg-gray-900">
      {/* Scores */}
      <div className="absolute top-4 left-4 text-xl text-white">{scoreLeft}</div>
      <div className="absolute top-4 right-4 text-xl text-white">{scoreRight}</div>

      {/* Barre centrale */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-full w-1 bg-white opacity-50"></div>

      {/* Balle */}
      <div
        className="absolute bg-white rounded-full"
        style={{
          width: "20px",
          height: "20px",
          left: `${ballPosition.x}%`,
          top: `${ballPosition.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      ></div>

      {/* Raquette gauche */}
      <div
        className="absolute bg-white rounded"
        style={{
          width: "10px",
          height: "80px",
          left: "20px",
          top: `${leftPaddle.y}%`,
          transform: "translateY(-50%)",
        }}
      ></div>

      {/* Raquette droite */}
      <div
        className="absolute bg-white rounded"
        style={{
          width: "10px",
          height: "80px",
          right: "20px",
          top: `${rightPaddle.y}%`,
          transform: "translateY(-50%)",
        }}
      ></div>
    </div>
  );
} 