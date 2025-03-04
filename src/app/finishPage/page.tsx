"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import FinishPage from "../finishPage";

export default function FinishPageRoute() {
  const router = useRouter();
  
  // Cette page ne devrait pas être accessible directement
  // Elle devrait recevoir des paramètres de la page du jeu
  useEffect(() => {
    // Vérifie si les données du jeu sont disponibles dans localStorage
    const winner = localStorage.getItem("winner");
    const duration = localStorage.getItem("duration");
    const exchanges = localStorage.getItem("exchanges");
    const finalScore = localStorage.getItem("finalScore");
    
    // Si les données ne sont pas disponibles, rediriger vers la page de lancement
    if (!winner || !duration || !exchanges || !finalScore) {
      router.push("/launchPage");
    }
  }, [router]);
  
  // Récupère les données du localStorage pour les afficher
  const winner = typeof window !== "undefined" ? localStorage.getItem("winner") || "Joueur" : "Joueur";
  const duration = typeof window !== "undefined" ? localStorage.getItem("duration") || "00:00" : "00:00";
  const exchanges = typeof window !== "undefined" ? parseInt(localStorage.getItem("exchanges") || "0") : 0;
  const finalScore = typeof window !== "undefined" ? localStorage.getItem("finalScore") || "0-0" : "0-0";
  
  return <FinishPage 
    winner={winner} 
    duration={duration}
    exchanges={exchanges}
    finalScore={finalScore}
  />;
} 