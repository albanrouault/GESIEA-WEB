"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FinishPage() {
  const router = useRouter();
  const [gameData, setGameData] = useState({
    winner: "Joueur",
    duration: "00:00",
    exchanges: 0,
    finalScore: "0-0"
  });
  
  useEffect(() => {
    // Récupérer les données du jeu depuis localStorage
    if (typeof window !== "undefined") {
      const winner = localStorage.getItem("winner");
      const duration = localStorage.getItem("duration");
      const exchanges = localStorage.getItem("exchanges");
      const finalScore = localStorage.getItem("finalScore");
      
      // Si les données ne sont pas disponibles, rediriger vers la page de lancement
      if (!winner || !duration || !exchanges || !finalScore) {
        router.push("/launch");
        return;
      }
      
      setGameData({
        winner: winner,
        duration: duration,
        exchanges: parseInt(exchanges),
        finalScore: finalScore
      });
    }
  }, [router]);
  
  const handleReplay = () => {
    router.push("/launch");
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800">
      <h1 className="text-4xl font-bold mb-6">Fin de la partie</h1>
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md w-full max-w-md">
        <p className="text-lg mb-2">
          <strong>Gagnant :</strong> {gameData.winner}
        </p>
        <p className="text-lg mb-2">
          <strong>Durée de la partie :</strong> {gameData.duration}
        </p>
        <p className="text-lg mb-2">
          <strong>Nombre total d'échanges :</strong> {gameData.exchanges}
        </p>
        <p className="text-lg mb-2">
          <strong>Score final :</strong> {gameData.finalScore}
        </p>
        <button 
          onClick={handleReplay}
          className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Rejouer
        </button>
      </div>
    </div>
  );
} 