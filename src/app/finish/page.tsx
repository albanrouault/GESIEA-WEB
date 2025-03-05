"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSerial } from "../contexts/SerialContext";
import DebugConsole from "@/components/DebugConsole";

export default function FinishPage() {
  const router = useRouter();
  const [gameData, setGameData] = useState({
    winner: "Joueur 1", // Valeur par défaut
    duration: "00:00",
    finalScore: "0-0",
    player1Points: 0,
    player2Points: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const { isConnected } = useSerial();
  
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!isConnected) {
      router.push("/connexion");
      return;
    }
    
    // Récupérer les données du jeu depuis localStorage
    if (typeof window !== "undefined") {
      try {
        const winner = localStorage.getItem("winner");
        const duration = localStorage.getItem("duration");
        const finalScore = localStorage.getItem("finalScore");
        const player1Points = localStorage.getItem("player1Points");
        const player2Points = localStorage.getItem("player2Points");
        
        // Si les données essentielles sont disponibles
        if (winner && duration && finalScore) {
          setGameData({
            winner: winner,
            duration: duration,
            finalScore: finalScore,
            player1Points: parseInt(player1Points || "0", 10),
            player2Points: parseInt(player2Points || "0", 10)
          });
          setHasData(true);
        } else {
          // Si les données sont manquantes, rediriger vers la page de lancement après un court délai
          setTimeout(() => {
            router.push("/launch");
          }, 1000);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données de jeu:", error);
        // En cas d'erreur, rediriger également
        setTimeout(() => {
          router.push("/launch");
        }, 1000);
      } finally {
        setIsLoading(false);
      }
    }
  }, [router, isConnected]);
  
  const handleReplay = () => {
    // Nettoyer les données du localStorage avant de naviguer
    localStorage.removeItem("winner");
    localStorage.removeItem("duration");
    localStorage.removeItem("finalScore");
    localStorage.removeItem("player1Points");
    localStorage.removeItem("player2Points");
    router.push("/launch");
  };
  
  const handleHome = () => {
    // Nettoyer les données du localStorage avant de naviguer
    localStorage.removeItem("winner");
    localStorage.removeItem("duration");
    localStorage.removeItem("finalScore");
    localStorage.removeItem("player1Points");
    localStorage.removeItem("player2Points");
    router.push("/connexion");
  };
  
  // Afficher un écran de chargement pendant la récupération des données
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 flex flex-col items-center justify-center p-6">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-cyan-500 rounded-full mb-4"></div>
          <p className="text-white text-xl">Chargement des résultats...</p>
        </div>
      </div>
    );
  }
  
  // Afficher un message si aucune donnée n'est disponible
  if (!hasData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-black bg-opacity-30 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center">
          <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-white mb-4">Aucune donnée de jeu disponible</h2>
          <p className="text-gray-300 mb-6">Redirection vers la page de lancement...</p>
          <button 
            onClick={() => router.push("/launch")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg"
          >
            Aller maintenant
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-black bg-opacity-30 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white border-opacity-10 overflow-hidden relative">
        {/* Effet de confettis pour la victoire */}
        <div className="absolute -top-10 -left-10 w-[150%] h-[150%] opacity-10">
          <div className="confetti"></div>
        </div>
        
        <div className="relative z-10">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Fin de partie</h1>
            <div className="w-24 h-1 mx-auto bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"></div>
          </div>
          
          <div className="bg-white bg-opacity-10 rounded-xl p-6 mb-8 border border-white border-opacity-10">
            {/* Trophée pour le gagnant */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                </svg>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">Gagnant</h2>
              <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500">{gameData.winner}</p>
            </div>
            
            <div className="h-px w-full bg-white opacity-10 my-4"></div>
            
            <div className="mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">Durée</div>
                <div className="text-3xl font-bold text-cyan-400">{gameData.duration}</div>
              </div>
            </div>
            
            {/* Tableau des scores */}
            <div className="bg-white bg-opacity-5 rounded-lg p-4 mb-2">
              <h3 className="text-white text-lg font-medium mb-3 text-center">Scores finaux</h3>
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="text-center">
                  <div className="font-bold text-2xl text-blue-400">{gameData.player1Points}</div>
                  <div className="text-xs text-gray-400 mt-1">Joueur 1</div>
                </div>
                <div className="text-center text-white text-2xl font-bold">-</div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-red-400">{gameData.player2Points}</div>
                  <div className="text-xs text-gray-400 mt-1">Joueur 2</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleHome}
              className="py-3 px-6 rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transform hover:scale-105 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              Accueil
            </button>
            <button 
              onClick={handleReplay}
              className="py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow-lg flex items-center justify-center transform hover:scale-105 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Rejouer
            </button>
          </div>
        </div>
      </div>
      
      {/* Animation de confettis */}
      <style jsx>{`
        .confetti {
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle, #ff0000 8px, transparent 8px),
            radial-gradient(circle, #ffff00 8px, transparent 8px),
            radial-gradient(circle, #00ff00 8px, transparent 8px),
            radial-gradient(circle, #0000ff 8px, transparent 8px),
            radial-gradient(circle, #ff00ff 8px, transparent 8px);
          background-size: 100px 100px;
          background-position: 
            0 0,
            25px 25px,
            50px 50px,
            75px 75px,
            100px 100px;
          animation: confetti 5s linear infinite;
          transform: rotate(10deg);
        }

        @keyframes confetti {
          0% {
            background-position: 
              0 0,
              25px 25px,
              50px 50px,
              75px 75px,
              100px 100px;
          }
          100% {
            background-position: 
              100px 100px,
              125px 125px,
              150px 150px,
              175px 175px,
              200px 200px;
          }
        }
      `}</style>
      
      {/* Ajout de la console de débogage */}
      <DebugConsole />
    </div>
  );
}