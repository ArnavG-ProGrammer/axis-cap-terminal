"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Shield, ChevronDown, CheckCircle2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TermsModalProps {
  onAccept: () => void;
}

export default function TermsModal({ onAccept }: TermsModalProps) {
  const [canAccept, setCanAccept] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      // If user has scrolled to the bottom (allow 20px leeway)
      if (scrollHeight - scrollTop - clientHeight < 20) {
        setCanAccept(true);
      }
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      // 1. Save to Supabase user_metadata
      const { error } = await supabase.auth.updateUser({
        data: { tcs_accepted: true, tcs_accepted_at: new Date().toISOString() }
      });
      
      if (error) throw error;
      
      // 2. Save to localStorage for immediate UI persistence across sessions
      localStorage.setItem('axis_tcs_accepted', 'true');
      
      onAccept();
    } catch (err: any) {
      alert(`Error verifying agreement: ${err.message}. Please try again.`);
      setIsAccepting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in relative">
        {/* Header */}
        <div className="p-6 border-b border-[#262626] bg-[#111] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="text-[#d79734] w-8 h-8" />
            <div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase">Terms of Service</h2>
              <p className="text-xs font-bold text-gray-500 tracking-wider">AXIS CAP INSTITUTIONAL TERMINAL</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#d79734]/10 border border-[#d79734]/30 px-3 py-1.5 rounded text-[#d79734] text-xs font-bold tracking-widest uppercase">
            <Lock size={14} /> Mandatory Verification
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-sm text-gray-400 custom-scrollbar relative"
        >
          <div className="space-y-4">
             <h3 className="text-white font-bold text-lg tracking-wider">1. Master Service Agreement</h3>
             <p className="leading-relaxed">
               By accessing the AXIS CAP Terminal ("The Platform"), you represent and warrant that you are a sophisticated institution, accredited investor, or professional academic engaging in financial analytics for designated purposes only. The quantitative diagnostic tools provided herein do not constitute licensed financial advice under the Securities and Exchange Board of India (SEBI) or the Securities Exchange Commission (US SEC) regulatory frameworks.
             </p>
          </div>

          <div className="space-y-4">
             <h3 className="text-white font-bold text-lg tracking-wider">2. Proprietary Methodology & DCF Integrity</h3>
             <p className="leading-relaxed">
               All discounted cash flow (DCF), momentum algorithms, Gordon Growth models, and Quantum AI output are generated entirely through programmatic assumptions modeled primarily using the Damodaran Methodology based on live scraped filings. AXIS CAP does not guarantee absolute mathematical accuracy of historical parsing nor takes liability for execution slippage based on these intrinsic valuation models.
             </p>
          </div>

          <div className="space-y-4">
             <h3 className="text-white font-bold text-lg tracking-wider">3. Execution Liability Release</h3>
             <p className="leading-relaxed">
               The Portfolio allocation, Backtesting module, and simulated trajectory engines are exclusively theoretical constructs utilizing Adjusted Time Series data. Simulated market conditions fundamentally lack real liquidity depth, latency barriers, and slippage physics. You structurally waive claims to any lost capital derived directly or indirectly via adherence to simulated results.
             </p>
          </div>

          <div className="space-y-4">
             <h3 className="text-white font-bold text-lg tracking-wider">4. Data Auditing & Aggregation</h3>
             <p className="leading-relaxed">
               Global exchange feeds (NASDAQ, NYSE, BSE, NSE), SEC Filings, and Open-Source indicators are inherently delayed or proxied to bypass conventional commercial data licensing. AXIS CAP operates under "Academic Fair Use". No commercial reliance should be independently driven strictly off the un-audited latency nodes present herein.
             </p>
          </div>

          <div className="space-y-4">
             <h3 className="text-white font-bold text-lg tracking-wider">5. Telemetry & AI Model Disclosure</h3>
             <p className="leading-relaxed">
               Prompting the Quantum AI Diagnostics engine strictly authorizes Google Generative AI processing of associated public terminal tickers and explicit input context. User identity metadata (Session ID, Auth Tokens) is explicitly decoupled from LLM inference streams.
             </p>
             <p className="leading-relaxed pb-4 border-b border-[#262626]">
               Any attempts to reverse engineer API layers, spoof proxy data, bypass regional locks, or scrape algorithmic outputs for external commercial distribution will result in terminal banishment and possible legal escalation. 
             </p>
             <p className="text-center font-bold tracking-widest text-[#d79734] animate-pulse mt-4">
               --- END OF TERMS ---
             </p>
          </div>

          {!canAccept && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce text-gray-500">
               <span className="text-[10px] uppercase font-bold tracking-widest">Scroll to bottom</span>
               <ChevronDown size={16} />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#262626] bg-[#000] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">
             Reading Status: {canAccept ? <span className="text-[#34d74a]">Verified</span> : <span className="text-gray-400">Pending</span>}
          </p>
          <button 
             onClick={handleAccept}
             disabled={!canAccept || isAccepting}
             className={`px-8 py-3 rounded-lg font-black uppercase tracking-widest text-sm flex items-center gap-2 transition-all ${
               canAccept && !isAccepting 
                 ? "bg-gradient-to-r from-[#d79734] to-[#a67425] text-black shadow-[0_0_20px_rgba(215,151,52,0.3)] hover:opacity-90" 
                 : "bg-[#262626] text-gray-500 cursor-not-allowed"
             }`}
          >
             {isAccepting ? "Verifying..." : "I Accept the Terms"}
             {canAccept && !isAccepting && <CheckCircle2 size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
