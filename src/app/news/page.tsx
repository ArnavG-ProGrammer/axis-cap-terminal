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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[800px]">
          
          {/* Primary News Feed (TradingView) */}
          <div className="xl:col-span-1 bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden flex flex-col shadow-2xl relative">
             <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between bg-[#111]">
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#34d74a] animate-pulse"></div>
                    <h2 className="text-sm uppercase font-bold tracking-widest text-white">
                      Live Wire
                    </h2>
                 </div>
                 <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">TradingView</span>
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

          {/* Secondary / Custom Aggregated Feed */}
          <div className="xl:col-span-2 bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden flex flex-col shadow-2xl relative">
             <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between bg-[#111]">
                 <div className="flex items-center gap-3">
                    <Newspaper className="text-[#34d74a]" size={18} />
                    <h2 className="text-sm uppercase font-bold tracking-widest text-white">Global Institutional Feed</h2>
                 </div>
                 <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">Aggregated Pipeline</span>
             </div>
             
             <div className="flex-1 relative overflow-y-auto bg-[#0a0a0a] p-6 space-y-4" id="news-scroll-container">
                <CustomNewsFeed />
             </div>
          </div>

        </div>

      </div>
    </>
  );
}

function CustomNewsFeed() {
  const [news, setNews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visibleCount, setVisibleCount] = React.useState(50);

  React.useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(d => {
        setNews(d.news || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadMore = () => setVisibleCount(prev => prev + 50);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 font-mono text-sm">
         <div className="w-8 h-8 border-2 border-[#34d74a]/20 border-t-[#34d74a] rounded-full animate-spin mb-4" />
         Aggregating 1000+ sources...
      </div>
    );
  }

  return (
    <>
      {news.slice(0, visibleCount).map((article, i) => (
        <a key={i} href={article.link} target="_blank" rel="noopener noreferrer" className="block bg-[#111] border border-[#262626] rounded-xl p-5 hover:border-[#34d74a]/50 transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#34d74a]">{article.publisher}</span>
            <span className="text-xs text-gray-500">{new Date(article.publishedAt).toLocaleString()}</span>
          </div>
          <h3 className="text-white font-bold text-lg group-hover:text-[#34d74a] transition-colors line-clamp-2 leading-snug mb-2">{article.title}</h3>
          {article.description && (
             <div 
                className="text-sm text-gray-400 line-clamp-3 leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: article.description.replace(/<img[^>]*>/g, '') }} 
             />
          )}
        </a>
      ))}
      
      {visibleCount < news.length && (
        <button 
          onClick={loadMore}
          className="w-full py-4 mt-6 border border-[#262626] rounded-xl text-gray-400 font-bold uppercase tracking-widest text-sm hover:bg-[#111] hover:text-white transition-all"
        >
          Load More Intel
        </button>
      )}
    </>
  );
}
