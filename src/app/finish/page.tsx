"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSerial } from "../contexts/SerialContext";
import DebugConsole from "@/components/DebugConsole";

export default function FinishPage() {
  const router = useRouter();
  const { isConnected } = useSerial();
  const [gameData, setGameData] = useState<{
    winner: string;
    duration: string;
    finalScore: string;
  } | null>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!isConnected) {
      router.push("/connexion");
      return;
    }

    // Récupérer les données du jeu depuis le localStorage
    const winner = localStorage.getItem("winner");
    const duration = localStorage.getItem("duration");
    const finalScore = localStorage.getItem("finalScore");

    // Vérifier si toutes les données nécessaires sont présentes
    if (winner && duration && finalScore) {
      setGameData({ winner, duration, finalScore });
      // Nettoyer le localStorage après avoir récupéré les données
      localStorage.removeItem("winner");
      localStorage.removeItem("duration");
      localStorage.removeItem("finalScore");
    } else {
      // Si les données ne sont pas présentes, rediriger vers la page de configuration
      router.push("/config");
    }
  }, [isConnected, router]);

  // Si les données ne sont pas encore chargées, afficher un écran de chargement
  if (!gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 flex flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-cyan-500 rounded-full mb-4 shadow-[0_0_15px_rgba(6,182,212,0.7)]"></div>
          <p className="text-white text-xl">Chargement des résultats...</p>
        </div>
        <DebugConsole />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 flex flex-col items-center justify-center">
      <div className="bg-black bg-opacity-50 backdrop-blur-sm p-8 rounded-xl border border-cyan-500 shadow-lg flex flex-col items-center">
        <h1 className="text-4xl font-bold text-white mb-8">Fin de partie</h1>
        
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-2xl text-cyan-400 mb-2">Gagnant</h2>
            <p className="text-3xl font-bold text-white">{gameData.winner}</p>
          </div>
          
          <div>
            <h2 className="text-2xl text-cyan-400 mb-2">Score final</h2>
            <p className="text-3xl font-bold text-white">{gameData.finalScore}</p>
          </div>
          
          <div>
            <h2 className="text-2xl text-cyan-400 mb-2">Durée de la partie</h2>
            <p className="text-3xl font-bold text-white">{gameData.duration}</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/config")}
          className="mt-8 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg flex items-center cursor-pointer"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          Nouvelle partie
        </button>
      </div>
      
      <DebugConsole />
    </div>
  );
} 