"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { SlidersHorizontal } from "lucide-react";

// Custom TradingView Screener via iframe for reliability
function TradingViewScreenerIframe({ market }: { market: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.type = 'text/javascript';
    script.async = true;

    const config: any = {
      width: "100%",
      height: "100%",
      defaultColumn: "overview",
      defaultScreen: "most_capitalized",
      market: market,
      showToolbar: true,
      colorTheme: "dark",
      locale: "en",
    };

    script.innerHTML = JSON.stringify(config);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [market]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}

export default function ScreenerPage() {
  const [activeMarket, setActiveMarket] = useState<string>('america');

  const markets = [
    { key: 'america', label: 'US Markets' },
    { key: 'india', label: 'India (NSE/BSE)' },
    { key: 'uk', label: 'UK Markets' },
    { key: 'forex', label: 'Forex' },
    { key: 'crypto', label: 'Crypto' },
  ];

  return (
    <>
      <Head>
        <title>Stock Screener | AXIS CAP</title>
      </Head>

      <div className="max-w-7xl mx-auto pb-20 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 border-b border-[#262626] pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <SlidersHorizontal className="text-[#34d74a]" size={28} /> Technical Screener
            </h1>
            <p className="text-gray-400 mt-1">Filter global securities by P/E, market cap, volume, performance, and technical indicators.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {markets.map(m => (
              <button
                key={m.key}
                onClick={() => setActiveMarket(m.key)}
                className={`px-5 py-2 rounded-xl font-bold text-sm tracking-wider transition-all border whitespace-nowrap ${
                  activeMarket === m.key
                    ? 'bg-[#34d74a] text-black border-transparent shadow-[0_0_15px_rgba(52,215,74,0.3)]'
                    : 'bg-[#111] text-gray-400 hover:text-white border-[#262626]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ADVANCED QUANT ALERTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-[#0a0a0a] border border-[#34d74a]/30 rounded-xl p-5 shadow-[0_0_15px_rgba(52,215,74,0.05)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#34d74a]"></div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Deep Value (DCF Undervalued)</h3>
              <div className="space-y-3">
                 <div className="flex justify-between items-center bg-[#111] p-3 rounded-lg border border-[#262626]">
                    <div>
                       <div className="font-bold text-white">META</div>
                       <div className="text-[10px] text-gray-500">Meta Platforms</div>
                    </div>
                    <div className="text-right">
                       <div className="font-bold text-[#34d74a]">-24.5%</div>
                       <div className="text-[10px] text-gray-500">Discount</div>
                    </div>
                 </div>
                 <div className="flex justify-between items-center bg-[#111] p-3 rounded-lg border border-[#262626]">
                    <div>
                       <div className="font-bold text-white">PYPL</div>
                       <div className="text-[10px] text-gray-500">PayPal Holdings</div>
                    </div>
                    <div className="text-right">
                       <div className="font-bold text-[#34d74a]">-31.2%</div>
                       <div className="text-[10px] text-gray-500">Discount</div>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="bg-[#0a0a0a] border border-[#34d74a]/30 rounded-xl p-5 shadow-[0_0_15px_rgba(52,215,74,0.05)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#34d74a]"></div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Momentum Surge (MACD/RSI)</h3>
              <div className="space-y-3">
                 <div className="flex justify-between items-center bg-[#111] p-3 rounded-lg border border-[#262626]">
                    <div>
                       <div className="font-bold text-white">NVDA</div>
                       <div className="text-[10px] text-gray-500">NVIDIA Corp</div>
                    </div>
                    <div className="text-right">
                       <div className="font-bold text-[#34d74a]">Strong Buy</div>
                       <div className="text-[10px] text-gray-500">RSI: 78 | Vol+</div>
                    </div>
                 </div>
                 <div className="flex justify-between items-center bg-[#111] p-3 rounded-lg border border-[#262626]">
                    <div>
                       <div className="font-bold text-white">AMD</div>
                       <div className="text-[10px] text-gray-500">Adv Micro Devices</div>
                    </div>
                    <div className="text-right">
                       <div className="font-bold text-[#34d74a]">Breakout</div>
                       <div className="text-[10px] text-gray-500">MACD Cross</div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-[#0a0a0a] border border-[#d73434]/30 rounded-xl p-5 shadow-[0_0_15px_rgba(215,52,52,0.05)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#d73434]"></div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Institutional Distribution (Sell)</h3>
              <div className="space-y-3">
                 <div className="flex justify-between items-center bg-[#111] p-3 rounded-lg border border-[#262626]">
                    <div>
                       <div className="font-bold text-white">CVX</div>
                       <div className="text-[10px] text-gray-500">Chevron Corp</div>
                    </div>
                    <div className="text-right">
                       <div className="font-bold text-[#d73434]">High Risk</div>
                       <div className="text-[10px] text-gray-500">Insider Selling</div>
                    </div>
                 </div>
                 <div className="flex justify-between items-center bg-[#111] p-3 rounded-lg border border-[#262626]">
                    <div>
                       <div className="font-bold text-white">INTC</div>
                       <div className="text-[10px] text-gray-500">Intel Corp</div>
                    </div>
                    <div className="text-right">
                       <div className="font-bold text-[#d73434]">Weakness</div>
                       <div className="text-[10px] text-gray-500">Vol- / Support Break</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden shadow-2xl h-[700px]">
          <TradingViewScreenerIframe key={activeMarket} market={activeMarket} />
        </div>
      </div>
    </>
  );
}
