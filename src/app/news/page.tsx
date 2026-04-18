"use client";

import React, { useState } from 'react';
import Head from 'next/head';
import { Newspaper } from 'lucide-react';
import dynamic from 'next/dynamic';

const TimelineWidget = dynamic(
  () => import('react-ts-tradingview-widgets').then((mod) => mod.Timeline),
  { ssr: false }
);
const TickerTape = dynamic(
  () => import('react-ts-tradingview-widgets').then((mod) => mod.TickerTape),
  { ssr: false }
);

export default function NewsPage() {
  const [activeMarket, setActiveMarket] = useState<'stock' | 'forex' | 'crypto'>('stock');

  const marketOptions = [
    { key: 'stock' as const, label: 'Stocks & Indices', desc: 'Global equities and index movements' },
    { key: 'forex' as const, label: 'Forex & Macro', desc: 'Currency pairs and central bank news' },
    { key: 'crypto' as const, label: 'Crypto & DeFi', desc: 'Digital assets and blockchain news' },
  ];

  return (
    <>
      <Head>
        <title>Macro News | AXIS CAP</title>
      </Head>

      <div className="max-w-7xl mx-auto pb-20 space-y-6">

        {/* Live Ticker Tape */}
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden shadow-lg">
          <TickerTape colorTheme="dark" displayMode="compact" />
        </div>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Newspaper className="text-[#34d74a]" size={28} /> Macro Research Terminal
            </h1>
            <p className="text-gray-400 mt-1">Live market surveillance, algorithmic news parsing, and global broadcast streams powered by TradingView.</p>
          </div>
        </div>

        {/* Market Filter Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
          {marketOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setActiveMarket(opt.key)}
              className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wider transition-all whitespace-nowrap border ${
                activeMarket === opt.key
                  ? 'bg-[#34d74a] text-black border-transparent shadow-[0_0_15px_rgba(52,215,74,0.3)]'
                  : 'bg-[#111] text-gray-400 hover:text-white border-[#262626] hover:border-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Main News Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[700px]">
          
          {/* Primary News Feed */}
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden flex flex-col shadow-2xl relative">
             <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between bg-[#111]">
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#34d74a] animate-pulse"></div>
                    <h2 className="text-sm uppercase font-bold tracking-widest text-white">
                      {marketOptions.find(o => o.key === activeMarket)?.label} — Live Wire
                    </h2>
                 </div>
                 <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">TradingView Feed</span>
             </div>
             
             <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
                <TimelineWidget 
                  key={`primary-${activeMarket}`}
                  colorTheme="dark" 
                  feedMode="market" 
                  market={activeMarket}
                  displayMode="regular" 
                  height="100%" 
                  width="100%" 
                />
             </div>
          </div>

          {/* Secondary / General Feed */}
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden flex flex-col shadow-2xl relative">
             <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between bg-[#111]">
                 <div className="flex items-center gap-3">
                    <Newspaper className="text-gray-400" size={16} />
                    <h2 className="text-sm uppercase font-bold tracking-widest text-white">Global Markets Overview</h2>
                 </div>
                 <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">All Markets</span>
             </div>
             
             <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
                <TimelineWidget 
                  colorTheme="dark" 
                  feedMode="all_symbols" 
                  displayMode="regular" 
                  height="100%" 
                  width="100%" 
                />
             </div>
          </div>

        </div>

      </div>
    </>
  );
}
