"use client";

import { redirect } from 'next/navigation';
import DebugConsole from "@/components/DebugConsole";

export default function Home() {
  redirect('/connexion');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900">
      <DebugConsole />
    </div>
  );
}
