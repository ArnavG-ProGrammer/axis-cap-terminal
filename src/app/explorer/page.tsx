"use client";

import React, { useState } from "react";
import Head from "next/head";
import { Compass, TrendingUp, TrendingDown, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/components/CurrencyContext";

const SURF_ASSETS = [
   // EQUITIES
   { symbol: "AAPL", name: "Apple Inc", type: "EQUITY", price: 175.50, change: 1.25, region: "US" },
   { symbol: "MSFT", name: "Microsoft", type: "EQUITY", price: 420.55, change: 0.85, region: "US" },
   { symbol: "TSLA", name: "Tesla Inc", type: "EQUITY", price: 175.34, change: -1.2, region: "US" },
   { symbol: "NVDA", name: "NVIDIA Corp", type: "EQUITY", price: 852.12, change: 2.4, region: "US" },
   { symbol: "RELIANCE.NS", name: "Reliance Ind.", type: "EQUITY", price: 2980.50, change: 0.5, region: "INDIA" },
   { symbol: "HDFCBANK.NS", name: "HDFC Bank", type: "EQUITY", price: 1530.25, change: -0.3, region: "INDIA" },
   
   // FOREX
   { symbol: "EURUSD=X", name: "EUR/USD", type: "FOREX", price: 1.08, change: 0.15, region: "GLOBAL" },
   { symbol: "GBPUSD=X", name: "GBP/USD", type: "FOREX", price: 1.26, change: -0.05, region: "GLOBAL" },
   { symbol: "USDJPY=X", name: "USD/JPY", type: "FOREX", price: 151.40, change: 0.4, region: "GLOBAL" },
   { symbol: "USDINR=X", name: "USD/INR", type: "FOREX", price: 83.47, change: 0.05, region: "GLOBAL" },

   // CRYPTO
   { symbol: "BTC-USD", name: "Bitcoin", type: "CRYPTO", price: 68100.00, change: 4.2, region: "GLOBAL" },
   { symbol: "ETH-USD", name: "Ethereum", type: "CRYPTO", price: 3450.00, change: 2.1, region: "GLOBAL" },
   { symbol: "SOL-USD", name: "Solana", type: "CRYPTO", price: 185.20, change: 8.5, region: "GLOBAL" },

   // COMMODITIES
   { symbol: "GC=F", name: "Gold Futures", type: "COMMODITY", price: 2350.40, change: 1.1, region: "GLOBAL" },
   { symbol: "SI=F", name: "Silver Futures", type: "COMMODITY", price: 28.50, change: 2.3, region: "GLOBAL" },
   { symbol: "HG=F", name: "Copper Futures", type: "COMMODITY", price: 4.20, change: -0.8, region: "GLOBAL" }
];

export default function ExplorerPage() {
   const [activeFilter, setActiveFilter] = useState("ALL");
   const [searchQuery, setSearchQuery] = useState("");
   const [sortByVolatility, setSortByVolatility] = useState(false);
   const { currencySymbol, getConvertedPrice } = useCurrency();

   let filteredAssets = SURF_ASSETS.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (activeFilter === "ALL") return true;
      return a.type === activeFilter;
   });

   if (sortByVolatility) {
      filteredAssets.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
   }

   return (
      <>
         <Head>
            <title>Market Explorer | AXIS CAP</title>
         </Head>

         <div className="max-w-7xl mx-auto pb-20 space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[#262626] pb-6">
               <div>
                  <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-wider mb-2">
                  <Compass className="text-[#34d74a]" size={32} /> Market Explorer
                  </h1>
                  <p className="text-gray-400 mt-1">Surf high-liquidity global structures. Analyze momentum across primary asset classes.</p>
               </div>
               <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-[10px] text-gray-500" size={18} />
                  <input 
                     type="text" 
                     placeholder="Search Explorer..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-[#111] border border-[#262626] rounded-xl px-3 py-2 pl-10 text-white focus:outline-none focus:border-[#34d74a]"
                  />
               </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#262626] mb-8 gap-4">
               <div className="flex items-center overflow-x-auto no-scrollbar gap-2">
                  {['ALL', 'EQUITY', 'FOREX', 'CRYPTO', 'COMMODITY'].map(f => (
                     <button 
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-6 py-2 rounded-lg font-bold text-sm tracking-widest transition-all whitespace-nowrap ${activeFilter === f ? 'bg-[#34d74a] text-black shadow-[0_0_15px_rgba(52,215,74,0.3)] border border-transparent' : 'bg-[#111] text-gray-500 hover:text-white border border-[#262626]'}`}
                     >
                        {f}
                     </button>
                  ))}
               </div>
               <button 
                  onClick={() => setSortByVolatility(!sortByVolatility)}
                  className={`px-4 py-2 flex shrink-0 items-center gap-2 rounded-lg font-bold text-xs tracking-widest transition-all ${sortByVolatility ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-transparent' : 'bg-[#111] text-gray-500 hover:text-white border border-[#262626]'}`}
               >
                  <TrendingUp size={14} className={sortByVolatility ? "text-white" : "text-gray-500"} /> HIGH VOLATILITY
               </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredAssets.map(asset => {
                  const isUp = asset.change >= 0;
                  const convertedPrice = getConvertedPrice(asset.price, asset.symbol);
                  return (
                     <Link href={`/stock/${encodeURIComponent(asset.symbol)}`} key={asset.symbol}>
                        <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6 hover:border-[#34d74a]/50 transition-all group flex flex-col h-full hover:shadow-[0_0_30px_rgba(52,215,74,0.05)] relative overflow-hidden cursor-pointer">
                           
                           <div className="flex justify-between items-start mb-6 z-10">
                              <div>
                                 <h3 className="text-white font-bold text-xl tracking-wider">{asset.symbol}</h3>
                                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-[#111] px-2 py-0.5 rounded inline-block mt-2 border border-[#262626]">{asset.region} / {asset.type}</span>
                              </div>
                              <ArrowRight className="text-gray-600 group-hover:text-[#34d74a] transition-colors" size={20} />
                           </div>
                           
                           <div className="flex-grow"></div>
                           
                           <div className="z-10 mt-6">
                              <p className="text-gray-400 mb-2 font-medium text-sm">{asset.name}</p>
                              <div className="flex justify-between items-end">
                                 <span className="text-3xl font-black text-white truncate pr-4">{currencySymbol}{convertedPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: (asset.type === 'CRYPTO' || asset.type === 'FOREX') ? 4 : 2})}</span>
                                 <span className="flex items-center gap-1 font-bold text-sm bg-[#111] px-2 py-1 rounded" style={{ color: isUp ? '#34d74a' : '#d73434' }}>
                                    {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {Math.abs(asset.change)}%
                                 </span>
                              </div>
                           </div>
                        </div>
                     </Link>
                  );
               })}
            </div>

            {filteredAssets.length === 0 && (
               <div className="text-center py-20 text-gray-500 border border-[#262626] rounded-2xl bg-[#050505]">
                  <Search className="mx-auto mb-4 opacity-50" size={32} />
                  <p className="font-medium tracking-wide">No assets matched your search in this sector.</p>
               </div>
            )}
         </div>
      </>
   );
}
