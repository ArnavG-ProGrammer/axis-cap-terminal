"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ShieldAlert } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("axis_cap_cookie_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("axis_cap_cookie_consent", "accepted");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem("axis_cap_cookie_consent", "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-fade-in pointer-events-none">
      <div className="max-w-4xl mx-auto bg-[#0a0a0a]/95 backdrop-blur-xl border border-[#262626] rounded-2xl p-6 shadow-2xl pointer-events-auto flex flex-col md:flex-row gap-6 items-start md:items-center">
        
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 hidden sm:block">
            <ShieldAlert className="text-[#34d74a]" size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold tracking-wider uppercase text-sm mb-1">Data Processing & GDPR Compliance</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              We use necessary cookies to enable core functionality such as secure log-in and state persistence. 
              We also use analytics cookies to improve your experience. By clicking "Accept All", you consent to our use of cookies 
              as described in our <Link href="/privacy" className="text-[#34d74a] hover:underline">Privacy Policy</Link> and <Link href="/terms" className="text-[#34d74a] hover:underline">Terms of Service</Link>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <button 
            onClick={decline}
            className="flex-1 md:flex-none px-4 py-2 border border-[#333] hover:border-gray-500 rounded-lg text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
          >
            Necessary Only
          </button>
          <button 
            onClick={accept}
            className="flex-1 md:flex-none px-6 py-2 bg-[#34d74a] hover:bg-[#2bc43f] text-black rounded-lg text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(52,215,74,0.2)] transition-colors"
          >
            Accept All
          </button>
          <button onClick={decline} className="hidden md:flex p-2 text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
