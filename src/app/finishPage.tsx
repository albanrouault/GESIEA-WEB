"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface FinishPageProps {
  winner: string;
  duration: string;
  exchanges: number;
  finalScore: string;
}

const FinishPage: React.FC<FinishPageProps> = ({
  winner,
  duration,
  exchanges,
  finalScore,
}) => {
  const router = useRouter();
  
  const handleReplay = () => {
    router.push("/launchPage");
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800">
      <h1 className="text-4xl font-bold mb-6">Fin de la partie</h1>
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md w-full max-w-md">
        <p className="text-lg mb-2">
          <strong>Gagnant :</strong> {winner}
        </p>
        <p className="text-lg mb-2">
          <strong>Durée de la partie :</strong> {duration}
        </p>
        <p className="text-lg mb-2">
          <strong>Nombre total d'échanges :</strong> {exchanges}
        </p>
        <p className="text-lg mb-2">
          <strong>Score final :</strong> {finalScore}
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
};

export default FinishPage;
