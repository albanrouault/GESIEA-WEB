"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSerial } from '../app/contexts/SerialContext';

export default function DebugConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { receivedData, sendCommand } = useSerial();
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand de nouvelles données arrivent
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [receivedData]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && sendCommand) {
      sendCommand(message);
      setMessage('');
    }
  };

  return (
    <>
      {/* Bouton de débogage */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center cursor-pointer z-50"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        Debug
      </button>

      {/* Console de débogage */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-96 bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
          <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
            <h3 className="text-white font-mono text-sm">Console de débogage</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div 
            ref={consoleRef}
            className="p-4 h-[calc(100%-6rem)] overflow-y-auto font-mono text-sm"
          >
            <pre className="text-gray-300 whitespace-pre-wrap break-words">
              {receivedData || "Aucune donnée reçue"}
            </pre>
          </div>
          <form onSubmit={handleSendMessage} className="p-2 bg-gray-800 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Entrez une commande..."
                className="flex-1 bg-gray-700 text-white px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-sm"
              >
                Envoyer
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
} 