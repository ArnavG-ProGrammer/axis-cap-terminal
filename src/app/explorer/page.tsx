"use client";

import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { Compass, TrendingUp, TrendingDown, ArrowRight, Search, Activity, BarChart2, Zap } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/components/CurrencyContext";

const CORE_ASSETS = [
   // EQUITIES
   { symbol: "AAPL", name: "Apple Inc", type: "EQUITY", price: 175.50, change: 1.25, region: "US", sector: "Technology", volume: 55000000 },
   { symbol: "MSFT", name: "Microsoft", type: "EQUITY", price: 420.55, change: 0.85, region: "US", sector: "Technology", volume: 24000000 },
   { symbol: "TSLA", name: "Tesla Inc", type: "EQUITY", price: 175.34, change: -4.2, region: "US", sector: "Automotive", volume: 95000000 },
   { symbol: "NVDA", name: "NVIDIA Corp", type: "EQUITY", price: 852.12, change: 6.4, region: "US", sector: "Semiconductors", volume: 45000000 },
   { symbol: "RELIANCE.NS", name: "Reliance Ind.", type: "EQUITY", price: 2980.50, change: 0.5, region: "INDIA", sector: "Conglomerate", volume: 8000000 },
   { symbol: "HDFCBANK.NS", name: "HDFC Bank", type: "EQUITY", price: 1530.25, change: -0.3, region: "INDIA", sector: "Financials", volume: 15000000 },
   { symbol: "META", name: "Meta Platforms", type: "EQUITY", price: 490.20, change: 1.4, region: "US", sector: "Technology", volume: 18000000 },
   { symbol: "AMZN", name: "Amazon", type: "EQUITY", price: 180.55, change: -1.1, region: "US", sector: "E-Commerce", volume: 38000000 },
   { symbol: "GOOGL", name: "Alphabet", type: "EQUITY", price: 155.10, change: 0.7, region: "US", sector: "Technology", volume: 22000000 },
   { symbol: "NFLX", name: "Netflix", type: "EQUITY", price: 610.12, change: 2.1, region: "US", sector: "Entertainment", volume: 6000000 },
   { symbol: "JPM", name: "JPMorgan Chase", type: "EQUITY", price: 195.40, change: -0.8, region: "US", sector: "Financials", volume: 9000000 },
   { symbol: "V", name: "Visa Inc", type: "EQUITY", price: 275.60, change: 0.4, region: "US", sector: "Financials", volume: 5000000 },
   { symbol: "WMT", name: "Walmart", type: "EQUITY", price: 60.20, change: 0.2, region: "US", sector: "Retail", volume: 16000000 },
   
   // FOREX
   { symbol: "EURUSD=X", name: "EUR/USD", type: "FOREX", price: 1.08, change: 0.15, region: "GLOBAL", sector: "Currency", volume: 1000000000 },
   { symbol: "GBPUSD=X", name: "GBP/USD", type: "FOREX", price: 1.26, change: -0.05, region: "GLOBAL", sector: "Currency", volume: 850000000 },
   { symbol: "USDJPY=X", name: "USD/JPY", type: "FOREX", price: 151.40, change: 0.4, region: "GLOBAL", sector: "Currency", volume: 920000000 },
   { symbol: "USDINR=X", name: "USD/INR", type: "FOREX", price: 83.47, change: 0.05, region: "GLOBAL", sector: "Currency", volume: 120000000 },
   { symbol: "AUDUSD=X", name: "AUD/USD", type: "FOREX", price: 0.65, change: -0.1, region: "GLOBAL", sector: "Currency", volume: 300000000 },

   // CRYPTO
   { symbol: "BTC-USD", name: "Bitcoin", type: "CRYPTO", price: 68100.00, change: 4.2, region: "GLOBAL", sector: "Digital Asset", volume: 45000000000 },
   { symbol: "ETH-USD", name: "Ethereum", type: "CRYPTO", price: 3450.00, change: 2.1, region: "GLOBAL", sector: "Digital Asset", volume: 18000000000 },
   { symbol: "SOL-USD", name: "Solana", type: "CRYPTO", price: 185.20, change: 8.5, region: "GLOBAL", sector: "Digital Asset", volume: 3000000000 },
   { symbol: "DOGE-USD", name: "Dogecoin", type: "CRYPTO", price: 0.15, change: -5.4, region: "GLOBAL", sector: "Digital Asset", volume: 800000000 },
   { symbol: "AVAX-USD", name: "Avalanche", type: "CRYPTO", price: 45.30, change: 1.2, region: "GLOBAL", sector: "Digital Asset", volume: 400000000 },

   // COMMODITIES
   { symbol: "GC=F", name: "Gold Futures", type: "COMMODITY", price: 2350.40, change: 1.1, region: "GLOBAL", sector: "Precious Metals", volume: 250000 },
   { symbol: "SI=F", name: "Silver Futures", type: "COMMODITY", price: 28.50, change: 2.3, region: "GLOBAL", sector: "Precious Metals", volume: 85000 },
   { symbol: "HG=F", name: "Copper Futures", type: "COMMODITY", price: 4.20, change: -0.8, region: "GLOBAL", sector: "Base Metals", volume: 45000 },
   { symbol: "CL=F", name: "Crude Oil WTI", type: "COMMODITY", price: 82.50, change: 1.5, region: "GLOBAL", sector: "Energy", volume: 350000 }
];

// Dynamically scale array to mimic infinite structural load limits
const generateInfiniteAssets = () => {
    const expanded = [...CORE_ASSETS];
    for (let i = 1; i <= 20; i++) {
        CORE_ASSETS.forEach(b => {
             // Generate synthetic variance to emulate infinite organic assets
            const hashMod = (Math.sin(b.price * i) * 100);
            expanded.push({
                ...b,
                symbol: `${b.symbol}_X${i}`,
                name: `${b.name} (Tranche ${i})`,
                price: b.price * (1 + (hashMod / 1000)), // Slight price variation
                change: parseFloat((b.change + (Math.sin(i) * 3)).toFixed(2)), // Wider variance for deep scrolling volatility
                volume: Math.floor(b.volume * (1 + Math.random()))
            });
        });
    }
    return expanded;
};

const SURF_ASSETS = generateInfiniteAssets();

// Calculate most volatile native asset right now
const MOST_VOLATILE_ASSET = [...SURF_ASSETS].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];

export default function ExplorerPage() {
   const [activeFilter, setActiveFilter] = useState("ALL");
   const [searchQuery, setSearchQuery] = useState("");
   const [sortBy, setSortBy] = useState("POPULAR"); // POPULAR, VOLATILE, STABLE, PRICE_HIGH, PRICE_LOW
   const [visibleCount, setVisibleCount] = useState(24);
   
   const { currencySymbol, getConvertedPrice } = useCurrency();

   // Handle Infinite Scroll
   useEffect(() => {
      const handleScroll = () => {
          // If within 800px from the bottom, load more chunks
          if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) {
              setVisibleCount(prev => Math.min(prev + 18, SURF_ASSETS.length));
          }
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   const filteredAssets = useMemo(() => {
      let result = SURF_ASSETS.filter(a => {
         const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.symbol.toLowerCase().includes(searchQuery.toLowerCase());
         if (!matchSearch) return false;
         if (activeFilter === "ALL") return true;
         return a.type === activeFilter;
      });

      // Apply Structural Sorting
      switch(sortBy) {
          case 'VOLATILE':
              result.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
              break;
          case 'STABLE':
              result.sort((a, b) => Math.abs(a.change) - Math.abs(b.change));
              break;
          case 'PRICE_HIGH':
              result.sort((a, b) => b.price - a.price);
              break;
          case 'PRICE_LOW':
              result.sort((a, b) => a.price - b.price);
              break;
          case 'POPULAR':
          default:
              result.sort((a, b) => b.volume - a.volume);
              break;
      }

      return result;
   }, [searchQuery, activeFilter, sortBy]);

   // Slice only for active visible dom limit
   const displayedAssets = filteredAssets.slice(0, visibleCount);

   return (
      <>
         <Head>
            <title>Surf Market | AXIS CAP</title>
         </Head>

         <div className="max-w-7xl mx-auto pb-20 space-y-6">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-2 gap-4">
               <div>
                  <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-wider mb-2">
                  <Compass className="text-[#34d74a]" size={32} /> Surf Market
                  </h1>
                  <p className="text-gray-400 mt-1">Scroll indefinitely to surf global momentum. Dynamically loading infinite tranches.</p>
               </div>
            </div>

            {/* Volatility Banner */}
            <div className="bg-gradient-to-r from-red-500/10 via-[#111] to-[#0a0a0a] border border-[#262626] border-l-4 border-l-red-500 rounded-xl p-4 flex items-center justify-between mb-8 shadow-2xl">
               <div className="flex items-center gap-4">
                  <div className="bg-red-500/20 p-2 rounded-lg">
                      <Zap className="text-red-500 animate-pulse" size={24} />
                  </div>
                  <div>
                      <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">Most Volatile Asset Right Now</h4>
                      <div className="flex items-end gap-3">
                          <span className="text-2xl font-bold text-white leading-none">{MOST_VOLATILE_ASSET.name} ({MOST_VOLATILE_ASSET.symbol})</span>
                          <span className="text-sm font-bold bg-[#111] px-2 py-0.5 rounded border border-[#262626] text-gray-400">{MOST_VOLATILE_ASSET.sector}</span>
                      </div>
                  </div>
               </div>
               <div className="text-right">
                   <div className="flex items-center gap-2 font-black text-2xl" style={{ color: MOST_VOLATILE_ASSET.change >= 0 ? '#34d74a' : '#ef4444' }}>
                      {MOST_VOLATILE_ASSET.change >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                      {Math.abs(MOST_VOLATILE_ASSET.change)}%
                   </div>
                   <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">24H Variance</span>
               </div>
            </div>

            {/* Advanced Filters & Search */}
            <div className="bg-[#111] border border-[#262626] p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 mb-2">
               
               <div className="flex items-center overflow-x-auto no-scrollbar gap-2">
                  {['ALL', 'EQUITY', 'FOREX', 'CRYPTO', 'COMMODITY'].map(f => (
                     <button 
                        key={f}
                        onClick={() => { setActiveFilter(f); setVisibleCount(24); }}
                        className={`px-5 py-2 rounded-lg font-bold text-xs tracking-widest transition-all whitespace-nowrap ${activeFilter === f ? 'bg-[#34d74a] text-black shadow-[0_0_15px_rgba(52,215,74,0.3)] border border-transparent' : 'bg-[#0a0a0a] text-gray-500 hover:text-white border border-[#262626]'}`}
                     >
                        {f}
                     </button>
                  ))}
               </div>

               <div className="flex items-center gap-4 w-full md:w-auto">
                   <div className="relative flex-1 md:w-48">
                      <select 
                          value={sortBy}
                          onChange={(e) => { setSortBy(e.target.value); setVisibleCount(24); }}
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#34d74a] text-xs font-bold uppercase tracking-wide appearance-none"
                      >
                         <option value="POPULAR">Sort by: Vol / Popular</option>
                         <option value="VOLATILE">Sort by: Most Volatile</option>
                         <option value="STABLE">Sort by: Least Volatile</option>
                         <option value="PRICE_HIGH">Sort by: Highest Price</option>
                         <option value="PRICE_LOW">Sort by: Lowest Price</option>
                      </select>
                   </div>
                   
                   <div className="relative flex-1 md:w-56">
                      <Search className="absolute left-3 top-[10px] text-gray-500" size={16} />
                      <input 
                         type="text" 
                         placeholder="Search Tickers..." 
                         value={searchQuery}
                         onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(24); }}
                         className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-3 py-2 pl-9 text-white focus:outline-none focus:border-[#34d74a] text-sm"
                      />
                   </div>
               </div>
            </div>

            {/* Scrolling Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
               {displayedAssets.map((asset, i) => {
                  const isUp = asset.change >= 0;
                  const convertedPrice = getConvertedPrice(asset.price, asset.symbol);
                  return (
                     <Link href={`/stock/${encodeURIComponent(asset.symbol)}`} key={`${asset.symbol}-${i}`}>
                        <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-5 hover:border-[#34d74a]/50 transition-all hover:-translate-y-1 group flex flex-col h-full hover:shadow-[0_0_30px_rgba(52,215,74,0.05)] relative overflow-hidden cursor-pointer">
                           
                           <div className="flex justify-between items-start mb-4 z-10 w-full overflow-hidden">
                              <div className="w-full overflow-hidden">
                                 <div className="flex items-center justify-between w-full">
                                    <h3 className="text-white font-black tracking-widest truncate">{asset.symbol}</h3>
                                    {isUp ? <TrendingUp className="text-[#34d74a] shrink-0" size={16}/> : <TrendingDown className="text-red-500 shrink-0" size={16}/>}
                                 </div>
                                 <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                     <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-[#111] px-1.5 py-0.5 rounded border border-[#262626] shrink-0">{asset.type}</span>
                                     <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-[#34d74a]/10 px-1.5 py-0.5 rounded border border-[#34d74a]/20 truncate">{asset.sector}</span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="flex-grow"></div>
                           
                           <div className="z-10 mt-4 border-t border-[#1a1a1a] pt-4">
                              <p className="text-gray-500 mb-1 font-bold text-[11px] uppercase tracking-wide truncate">{asset.name}</p>
                              <div className="flex justify-between items-end">
                                 <span className="text-2xl font-black text-white truncate pr-2" style={{ fontFamily: 'monospace' }}>
                                     {currencySymbol}{convertedPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: (asset.type === 'CRYPTO' || asset.type === 'FOREX') ? 4 : 2})}
                                 </span>
                                 <span className="font-bold text-xs" style={{ color: isUp ? '#34d74a' : '#ef4444', fontFamily: 'monospace' }}>
                                    {isUp ? '+' : ''}{asset.change.toFixed(2)}%
                                 </span>
                              </div>
                           </div>
                        </div>
                     </Link>
                  );
               })}
            </div>

            {/* Continuous Loading Indication */}
            {visibleCount < filteredAssets.length && (
               <div className="py-8 text-center flex justify-center w-full">
                   <div className="bg-[#111] px-6 py-3 rounded-full border border-[#262626] text-sm text-gray-500 font-bold uppercase tracking-widest flex items-center gap-3">
                       <Activity className="animate-spin text-[#34d74a]" size={16} />
                       Synthesizing Tranches...
                   </div>
               </div>
            )}

            {filteredAssets.length === 0 && (
               <div className="text-center py-20 text-gray-500 border border-[#262626] rounded-2xl bg-[#050505]">
                  <Search className="mx-auto mb-4 opacity-50" size={32} />
                  <p className="font-medium tracking-wide">No assets matched your structural search criteria.</p>
               </div>
            )}
         </div>
      </>
   );
}
