"use client";

import React from 'react';
import Head from 'next/head';
import { Newspaper } from 'lucide-react';
import dynamic from 'next/dynamic';

const TimelineWidget = dynamic(
  () => import('react-ts-tradingview-widgets').then((mod) => mod.Timeline),
  { ssr: false }
);

const MarketOverviewWidget = dynamic(
  () => import('react-ts-tradingview-widgets').then((mod) => mod.MarketOverview),
  { ssr: false }
);

export default function NewsPage() {
  return (
    <>
      <Head>
        <title>Macro News | AXIS CAP</title>
      </Head>

      <div className="max-w-7xl mx-auto pb-20 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Newspaper className="text-[var(--theme-accent, #34d74a)]" size={24} /> Macro Research Terminal
            </h1>
            <p className="text-gray-400 mt-1">Live market surveillance, algorithmic news parsing, and global broadcast streams.</p>
          </div>
        </div>

        {/* Top Split Layout: TV Left, Timeline Right */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[700px]">
          
          {/* Live Video Embed */}
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden flex flex-col shadow-2xl relative">
             <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between bg-[#111]">
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                    <h2 className="text-sm uppercase font-bold tracking-widest text-white">Global Markets Live</h2>
                 </div>
                 <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">Global Feed</span>
             </div>
             
             <div className="flex-1 relative overflow-hidden bg-[#0a0a0a] flex items-center justify-center">
                <iframe 
                   src="https://www.youtube.com/embed/live_stream?channel=UCoMdktPbSTixAyNGwb-UYkQ&autoplay=1&mute=1" 
                   className="absolute inset-0 w-full h-full border-0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
                ></iframe>
                {/* Fallback Warning Overlay in case of user ad-blocker suppression */}
                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur text-xs p-3 rounded border border-gray-800 text-gray-500 max-w-[200px] pointer-events-none">
                  If the broadcast refuses to connect, disable 'Strict Tracking Prevention' inside your browser shields. No external API keys are required; YouTube natively handles the video matrix.
                </div>
             </div>
          </div>

          {/* TradingView Timeline */}
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden flex flex-col shadow-2xl relative">
             <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between bg-[#111]">
                 <div className="flex items-center gap-3">
                    <Newspaper className="text-gray-400" size={16} />
                    <h2 className="text-sm uppercase font-bold tracking-widest text-white">Algorithmic Wire</h2>
                 </div>
                 <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">TradingView Proxy</span>
             </div>
             
             <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
                <TimelineWidget colorTheme="dark" feedMode="market" market="stock" displayMode="regular" height="100%" width="100%" />
             </div>
          </div>

        </div>

      </div>
    </>
  );
}
