"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSerial } from "../contexts/SerialContext";
import DebugConsole from "@/components/DebugConsole";

export default function LaunchPage() {
  const router = useRouter();
  const [winPoints, setWinPoints] = useState(5);
  const [ballSpeed, setBallSpeed] = useState(5);
  const [ballSize, setBallSize] = useState(5);
  const [paddleSize, setPaddleSize] = useState(5);
  const [paddleSpeed, setPaddleSpeed] = useState(5);
  const [loading, setLoading] = useState(true);
  const { isConnected, sendCommand } = useSerial();
  
  // Dimensions de base pour le terrain (valeurs par défaut plus élevées)
  const BASE_GRID_WIDTH = 400;
  const BASE_GRID_HEIGHT = 300;
  
  // Facteur de mise à l'échelle pour les valeurs des sliders
  // (rapport entre valeur max du slider et paramètre attendu)
  const SLIDER_SCALE_FACTOR = {
    ballSpeed: 0.5,  // Facteur d'échelle pour la vitesse de la balle
    ballSize: 0.8,   // Facteur d'échelle pour la taille de la balle
    paddleSize: 4,   // Facteur d'échelle pour la taille des raquettes
    paddleSpeed: 0.6  // Facteur d'échelle pour la vitesse des raquettes
  };
  
  // Calculer les dimensions du terrain en fonction de la taille d'affichage
  const calculateTerrainDimensions = () => {
    // Obtenir les dimensions réelles du composant qui contiendra le jeu
    // max-w-5xl = 64rem = 1024px max-width
    const maxWidth = 1024;
    // Obtenir la hauteur de la fenêtre
    const windowHeight = window.innerHeight;
    // Calculer la hauteur du terrain (80vh)
    const terrainHeight = windowHeight * 0.8;
    
    // Calculer la largeur réelle du terrain (en respectant les contraintes)
    const terrainWidth = Math.min(maxWidth, window.innerWidth * 0.9);
    
    // Définir un ratio d'aspect souhaité (4:3 est standard pour les jeux)
    const aspectRatio = 4/3;
    
    // Calculer les dimensions finales en fonction de l'aspect ratio
    let finalWidth, finalHeight;
    
    if (terrainWidth / terrainHeight > aspectRatio) {
      // Si la zone disponible est plus large que l'aspect ratio
      finalHeight = terrainHeight;
      finalWidth = terrainHeight * aspectRatio;
    } else {
      // Si la zone disponible est plus étroite que l'aspect ratio
      finalWidth = terrainWidth;
      finalHeight = terrainWidth / aspectRatio;
    }
    
    // Calculer les dimensions de la grille logique (plus grande pour plus de précision)
    // Utilisons une base de 400x300 comme dimensions minimales
    const gridWidth = Math.max(BASE_GRID_WIDTH, Math.round(finalWidth / 2));
    const gridHeight = Math.max(BASE_GRID_HEIGHT, Math.round(finalHeight / 2));
    
    return { width: gridWidth, height: gridHeight, aspectRatio };
  };

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    if (!isConnected) {
      router.push("/connexion");
    } else {
      setLoading(false);
      
      // Récupérer les paramètres stockés s'ils existent
      const storedWinPoints = localStorage.getItem("winPoints");
      const storedBallSpeed = localStorage.getItem("ballSpeed");
      const storedBallSize = localStorage.getItem("ballSize");
      const storedPaddleSize = localStorage.getItem("paddleSize");
      const storedPaddleSpeed = localStorage.getItem("paddleSpeed");
      
      if (storedWinPoints) setWinPoints(parseInt(storedWinPoints));
      if (storedBallSpeed) setBallSpeed(parseInt(storedBallSpeed));
      if (storedBallSize) setBallSize(parseInt(storedBallSize));
      if (storedPaddleSize) setPaddleSize(parseInt(storedPaddleSize));
      if (storedPaddleSpeed) setPaddleSpeed(parseInt(storedPaddleSpeed));
    }
  }, [isConnected, router]);

  // Retour à la page de connexion
  const backToConnection = () => {
    router.push("/connexion");
  };

  // Adapter les paramètres des sliders en fonction de la taille de la grille
  const scaleParameters = (dimensions: { width: number; height: number; aspectRatio?: number }) => {
    // Calcul des valeurs adaptées à la taille du terrain
    
    // Base de référence: terrain de 400x300
    const referenceWidth = BASE_GRID_WIDTH;
    const referenceHeight = BASE_GRID_HEIGHT;
    
    // Facteurs d'échelle spécifiques aux dimensions
    const widthRatio = dimensions.width / referenceWidth;
    const heightRatio = dimensions.height / referenceHeight;
    
    // Calcul de la taille des raquettes (proportionnelle à la hauteur du terrain)
    // Convertir la valeur du slider (1-10) en pourcentage de la hauteur du terrain
    // Petite raquette = 10% de la hauteur, grande raquette = 35% de la hauteur
    const minPaddlePercent = 10; // 10% de la hauteur pour slider = 1
    const maxPaddlePercent = 35; // 35% de la hauteur pour slider = 10
    const paddleHeightPercent = minPaddlePercent + ((maxPaddlePercent - minPaddlePercent) * (paddleSize - 1) / 9);
    const scaledPaddleSize = Math.round((paddleHeightPercent / 100) * dimensions.height);
    
    // Calcul de la taille de la balle (proportionnelle à la plus petite dimension du terrain)
    // Petite balle = 1.5% de la hauteur, grande balle = 5% de la hauteur
    const minBallPercent = 1.5;
    const maxBallPercent = 5;
    const ballSizePercent = minBallPercent + ((maxBallPercent - minBallPercent) * (ballSize - 1) / 9);
    const scaledBallSize = Math.max(3, Math.round((ballSizePercent / 100) * Math.min(dimensions.width, dimensions.height)));
    
    // Vitesse de la balle (ajustée en fonction de la taille du terrain)
    // La vitesse doit augmenter proportionnellement à la taille du terrain
    const minBallSpeed = 1;
    const maxBallSpeed = 6;
    const rawBallSpeed = minBallSpeed + ((maxBallSpeed - minBallSpeed) * (ballSpeed - 1) / 9);
    // Ajuster en fonction de la diagonale du terrain pour une expérience cohérente
    const diagonalRatio = Math.sqrt(Math.pow(widthRatio, 2) + Math.pow(heightRatio, 2)) / Math.sqrt(2);
    const scaledBallSpeed = Math.max(1, Math.round(rawBallSpeed * diagonalRatio));
    
    // Vitesse des raquettes (ajustée pour maintenir un gameplay équilibré)
    const minPaddleSpeed = 1;
    const maxPaddleSpeed = 8;
    const rawPaddleSpeed = minPaddleSpeed + ((maxPaddleSpeed - minPaddleSpeed) * (paddleSpeed - 1) / 9);
    const scaledPaddleSpeed = Math.max(1, Math.round(rawPaddleSpeed * heightRatio));
    
    console.log("Paramètres d'origine:", { ballSpeed, ballSize, paddleSize, paddleSpeed });
    console.log("Paramètres adaptés:", { 
      scaledBallSpeed, 
      scaledBallSize, 
      scaledPaddleSize, 
      scaledPaddleSpeed,
      paddleHeightPercent: paddleHeightPercent + "%",
      ballSizePercent: ballSizePercent + "%"
    });
    
    return {
      ballSpeed: scaledBallSpeed,
      ballSize: scaledBallSize,
      paddleSize: scaledPaddleSize,
      paddleSpeed: scaledPaddleSpeed
    };
  };

  // Démarrage du jeu
  const handleLaunchGame = async () => {
    try {
      // Calculer les dimensions réelles du terrain
      const dimensions = calculateTerrainDimensions();
      
      // Calculer les zones de jeu (25% de la largeur à gauche et à droite)
      const leftZoneWidth = Math.round(dimensions.width * 0.25);
      const rightZoneWidth = Math.round(dimensions.width * 0.25);
      
      // Adapter les paramètres à la taille du terrain
      const scaledParams = scaleParameters(dimensions);
      
      console.log("Dimensions du terrain:", dimensions);
      console.log("Paramètres adaptés:", scaledParams);
      
      // Envoi de la trame formatée au STM32 avec le nouveau format
      // Format: game:start:largeurTerrain:hauteurTerrain:pointsGagnants:vitesseBalle:tailleBalle:vitesseRaquette:tailleRaquette:zoneGauche:zoneDroite
      await sendCommand(`game:start:${dimensions.width}:${dimensions.height}:${winPoints}:${scaledParams.ballSpeed}:${scaledParams.ballSize}:${scaledParams.paddleSpeed}:${scaledParams.paddleSize}:${leftZoneWidth}:${rightZoneWidth}`);
      
      // Stocker les paramètres originaux (non ajustés) pour le jeu
      localStorage.setItem("winPoints", winPoints.toString());
      localStorage.setItem("ballSpeed", ballSpeed.toString());
      localStorage.setItem("ballSize", ballSize.toString());
      localStorage.setItem("paddleSize", paddleSize.toString());
      localStorage.setItem("paddleSpeed", paddleSpeed.toString());
      
      // Stocker également les dimensions du terrain pour référence
      localStorage.setItem("gridWidth", dimensions.width.toString());
      localStorage.setItem("gridHeight", dimensions.height.toString());
      
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 flex flex-col items-center justify-center p-4">
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
            className={`w-full py-4 px-6 rounded-lg flex items-center justify-center ${!isConnected ? 'bg-opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all cursor-pointer'} text-white shadow-lg text-lg font-bold`}
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
            className="w-full py-3 px-6 rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Retour
          </button>
        </div>
      </div>
      
      {/* Ajout de la console de débogage */}
      <DebugConsole />
    </div>
  );
}