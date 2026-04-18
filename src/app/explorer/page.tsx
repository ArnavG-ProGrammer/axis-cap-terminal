"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import { Compass, TrendingUp, TrendingDown, ArrowRight, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/components/CurrencyContext";

const FEATURED_ASSETS = [
   // US EQUITIES
   { symbol: "AAPL", name: "Apple Inc", type: "EQUITY", price: 175.50, change: 1.25, region: "US" },
   { symbol: "MSFT", name: "Microsoft", type: "EQUITY", price: 420.55, change: 0.85, region: "US" },
   { symbol: "TSLA", name: "Tesla Inc", type: "EQUITY", price: 175.34, change: -1.2, region: "US" },
   { symbol: "NVDA", name: "NVIDIA Corp", type: "EQUITY", price: 852.12, change: 2.4, region: "US" },
   { symbol: "AMZN", name: "Amazon.com", type: "EQUITY", price: 178.25, change: 1.8, region: "US" },
   { symbol: "META", name: "Meta Platforms", type: "EQUITY", price: 505.40, change: 0.95, region: "US" },
   { symbol: "GOOGL", name: "Alphabet Inc", type: "EQUITY", price: 155.72, change: 0.65, region: "US" },

   // INDIA EQUITIES
   { symbol: "RELIANCE.NS", name: "Reliance Industries", type: "EQUITY", price: 2980.50, change: 0.5, region: "INDIA" },
   { symbol: "HDFCBANK.NS", name: "HDFC Bank", type: "EQUITY", price: 1530.25, change: -0.3, region: "INDIA" },
   { symbol: "TCS.NS", name: "Tata Consultancy", type: "EQUITY", price: 3890.00, change: 1.1, region: "INDIA" },
   { symbol: "INFY.NS", name: "Infosys Ltd", type: "EQUITY", price: 1420.50, change: -0.6, region: "INDIA" },
   { symbol: "TATAMOTORS.NS", name: "Tata Motors", type: "EQUITY", price: 980.25, change: 2.1, region: "INDIA" },
   { symbol: "ICICIBANK.NS", name: "ICICI Bank", type: "EQUITY", price: 1105.00, change: 0.8, region: "INDIA" },
   { symbol: "WIPRO.NS", name: "Wipro Ltd", type: "EQUITY", price: 480.50, change: -0.4, region: "INDIA" },
   { symbol: "SBIN.NS", name: "State Bank India", type: "EQUITY", price: 780.00, change: 1.5, region: "INDIA" },
   
   // FOREX
   { symbol: "EURUSD=X", name: "EUR/USD", type: "FOREX", price: 1.08, change: 0.15, region: "GLOBAL" },
   { symbol: "GBPUSD=X", name: "GBP/USD", type: "FOREX", price: 1.26, change: -0.05, region: "GLOBAL" },
   { symbol: "USDJPY=X", name: "USD/JPY", type: "FOREX", price: 151.40, change: 0.4, region: "GLOBAL" },
   { symbol: "USDINR=X", name: "USD/INR", type: "FOREX", price: 83.47, change: 0.05, region: "GLOBAL" },

   // CRYPTO
   { symbol: "BTC-USD", name: "Bitcoin", type: "CRYPTO", price: 68100.00, change: 4.2, region: "GLOBAL" },
   { symbol: "ETH-USD", name: "Ethereum", type: "CRYPTO", price: 3450.00, change: 2.1, region: "GLOBAL" },
   { symbol: "SOL-USD", name: "Solana", type: "CRYPTO", price: 185.20, change: 8.5, region: "GLOBAL" },
   { symbol: "XRP-USD", name: "Ripple", type: "CRYPTO", price: 0.62, change: -1.2, region: "GLOBAL" },

   // COMMODITIES
   { symbol: "GC=F", name: "Gold Futures", type: "COMMODITY", price: 2350.40, change: 1.1, region: "GLOBAL" },
   { symbol: "SI=F", name: "Silver Futures", type: "COMMODITY", price: 28.50, change: 2.3, region: "GLOBAL" },
   { symbol: "CL=F", name: "Crude Oil WTI", type: "COMMODITY", price: 78.20, change: -0.9, region: "GLOBAL" },
   { symbol: "HG=F", name: "Copper Futures", type: "COMMODITY", price: 4.20, change: -0.8, region: "GLOBAL" }
];

export default function ExplorerPage() {
   const [activeFilter, setActiveFilter] = useState("ALL");
   const [searchQuery, setSearchQuery] = useState("");
   const [sortByVolatility, setSortByVolatility] = useState(false);
   const { currencySymbol, getConvertedPrice } = useCurrency();
   
   // Live search results from API
   const [liveResults, setLiveResults] = useState<any[]>([]);
   const [isSearching, setIsSearching] = useState(false);
   const [hasSearched, setHasSearched] = useState(false);

   // Debounced live search
   useEffect(() => {
     if (searchQuery.length < 2) {
       setLiveResults([]);
       setHasSearched(false);
       return;
     }

     setIsSearching(true);
     const timer = setTimeout(async () => {
       try {
         const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
         const data = await res.json();
         if (data.quotes) {
           setLiveResults(data.quotes.slice(0, 30));
         }
       } catch (err) {
         console.error("Search error", err);
       }
       setIsSearching(false);
       setHasSearched(true);
     }, 500);

     return () => clearTimeout(timer);
   }, [searchQuery]);

   // Determine which assets to show
   const isLiveMode = searchQuery.length >= 2;

   // For featured assets (when no search)
   let filteredFeatured = FEATURED_ASSETS.filter(a => {
      if (activeFilter === "ALL") return true;
      if (activeFilter === "INDIA") return a.region === "INDIA";
      return a.type === activeFilter;
   });

   if (sortByVolatility) {
      filteredFeatured.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
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
                  <p className="text-gray-400 mt-1">Surf high-liquidity global structures. Search any stock, crypto, forex, or commodity worldwide.</p>
               </div>
               <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-[10px] text-gray-500" size={18} />
                  <input 
                     type="text" 
                     placeholder="Search any global asset... (e.g. RELIANCE, HDFC, AAPL)" 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-[#111] border border-[#262626] rounded-xl px-3 py-2 pl-10 text-white focus:outline-none focus:border-[#34d74a] text-sm"
                  />
                  {isSearching && <Loader2 className="absolute right-3 top-[10px] text-[#34d74a] animate-spin" size={18} />}
               </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#262626] mb-8 gap-4">
               <div className="flex items-center overflow-x-auto no-scrollbar gap-2">
                  {['ALL', 'INDIA', 'EQUITY', 'FOREX', 'CRYPTO', 'COMMODITY'].map(f => (
                     <button 
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-5 py-2 rounded-lg font-bold text-sm tracking-widest transition-all whitespace-nowrap ${activeFilter === f ? 'bg-[#34d74a] text-black shadow-[0_0_15px_rgba(52,215,74,0.3)] border border-transparent' : 'bg-[#111] text-gray-500 hover:text-white border border-[#262626]'}`}
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

            {/* Live Search Results */}
            {isLiveMode && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveResults.length > 0 ? (
                  liveResults.map(asset => {
                    const isUp = (asset.change || 0) >= 0;
                    return (
                      <Link href={`/stock/${encodeURIComponent(asset.symbol)}`} key={asset.symbol}>
                        <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6 hover:border-[#34d74a]/50 transition-all group flex flex-col h-full hover:shadow-[0_0_30px_rgba(52,215,74,0.05)] relative overflow-hidden cursor-pointer">
                           <div className="flex justify-between items-start mb-4 z-10">
                              <div>
                                 <h3 className="text-white font-bold text-xl tracking-wider">{asset.symbol}</h3>
                                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-[#111] px-2 py-0.5 rounded inline-block mt-2 border border-[#262626]">
                                   {asset.exchDisp || asset.exchange || asset.quoteType}
                                 </span>
                              </div>
                              <ArrowRight className="text-gray-600 group-hover:text-[#34d74a] transition-colors" size={20} />
                           </div>
                           <div className="flex-grow"></div>
                           <div className="z-10 mt-4">
                              <p className="text-gray-400 mb-2 font-medium text-sm truncate">{asset.shortname || asset.longname || asset.symbol}</p>
                              <div className="flex justify-between items-end">
                                 <span className="text-lg font-bold text-gray-400">{asset.quoteType}</span>
                                 <span className="flex items-center gap-1 font-bold text-sm bg-[#111] px-2 py-1 rounded" style={{ color: isUp ? '#34d74a' : '#d73434' }}>
                                    {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {asset.quoteType}
                                 </span>
                              </div>
                           </div>
                        </div>
                      </Link>
                    );
                  })
                ) : hasSearched && !isSearching ? (
                  <div className="col-span-3 text-center py-20 text-gray-500 border border-[#262626] rounded-2xl bg-[#050505]">
                     <Search className="mx-auto mb-4 opacity-50" size={32} />
                     <p className="font-medium tracking-wide">No assets found for &quot;{searchQuery}&quot;. Try a different ticker or name.</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Featured Assets (when no search) */}
            {!isLiveMode && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#34d74a] animate-pulse"></div>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Featured Assets</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredFeatured.map(asset => {
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
              </>
            )}

            {!isLiveMode && filteredFeatured.length === 0 && (
               <div className="text-center py-20 text-gray-500 border border-[#262626] rounded-2xl bg-[#050505]">
                  <Search className="mx-auto mb-4 opacity-50" size={32} />
                  <p className="font-medium tracking-wide">No assets matched your filter in this sector.</p>
               </div>
            )}
         </div>
      </>
   );
}
