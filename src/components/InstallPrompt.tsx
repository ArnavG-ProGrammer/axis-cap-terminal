"use client";

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      return;
    }

    // iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIos) {
      const hasDismissed = localStorage.getItem('axis_ios_install_dismissed');
      if (!hasDismissed) {
        setShowIosPrompt(true);
      }
    } else {
      // Android / Desktop Chrome PWA Detection
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const dismissIosPrompt = () => {
    localStorage.setItem('axis_ios_install_dismissed', 'true');
    setShowIosPrompt(false);
  };

  if (!showInstallPrompt && !showIosPrompt) return null;

  return (
    <>
      {/* Android / Desktop Install Button */}
      {showInstallPrompt && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="bg-[#00d4a0] hover:bg-[#00a87f] text-black font-black uppercase tracking-wider text-xs px-4 py-3 rounded-lg shadow-[0_0_20px_rgba(0,212,160,0.3)] flex items-center gap-2 transition-all"
          >
            <Download size={16} />
            Install AXIS CAP
          </button>
          <button 
            onClick={() => setShowInstallPrompt(false)}
            className="bg-[#111] hover:bg-[#1a1a1a] text-gray-500 hover:text-white p-3 rounded-lg border border-[#262626] transition-all"
            aria-label="Dismiss Install Prompt"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* iOS Safari Banner */}
      {showIosPrompt && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0c0f] border-t border-[#1a1a1a] p-4 pb-6 px-6 flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          <div className="text-gray-300 text-sm font-medium">
            Install AXIS CAP — tap <span className="text-[#00d4a0] font-bold">Share</span> <span className="mx-1">{"->"}</span> <span className="text-[#00d4a0] font-bold">Add to Home Screen</span>
          </div>
          <button onClick={dismissIosPrompt} className="text-gray-500 hover:text-white bg-[#111] p-2 rounded-md">
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
