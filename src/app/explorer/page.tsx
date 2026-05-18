"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { Compass, TrendingUp, TrendingDown, ArrowRight, Search, Loader2, Layers, X, Check, Activity } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/components/CurrencyContext";

// Master list of symbols for the grid (not the infinite deck)
const STATIC_ASSETS = [
   // US Tech
   { symbol: "AAPL", region: "US" }, { symbol: "MSFT", region: "US" }, { symbol: "TSLA", region: "US" },
   { symbol: "NVDA", region: "US" }, { symbol: "AMZN", region: "US" }, { symbol: "META", region: "US" },
   { symbol: "GOOGL", region: "US" }, { symbol: "AMD", region: "US" }, { symbol: "INTC", region: "US" }, { symbol: "NFLX", region: "US" },
   // US Finance
   { symbol: "JPM", region: "US" }, { symbol: "BAC", region: "US" }, { symbol: "GS", region: "US" }, { symbol: "V", region: "US" },
   // INDIA NIFTY 50
   { symbol: "RELIANCE.NS", region: "INDIA" }, { symbol: "HDFCBANK.NS", region: "INDIA" }, { symbol: "TCS.NS", region: "INDIA" },
   { symbol: "INFY.NS", region: "INDIA" }, { symbol: "TATAMOTORS.NS", region: "INDIA" }, { symbol: "ICICIBANK.NS", region: "INDIA" },
   { symbol: "WIPRO.NS", region: "INDIA" }, { symbol: "SBIN.NS", region: "INDIA" }, { symbol: "ITC.NS", region: "INDIA" },
   { symbol: "BAJFINANCE.NS", region: "INDIA" }, { symbol: "LT.NS", region: "INDIA" }, { symbol: "AXISBANK.NS", region: "INDIA" },
   { symbol: "MARUTI.NS", region: "INDIA" }, { symbol: "KOTAKBANK.NS", region: "INDIA" },
   // FOREX
   { symbol: "EURUSD=X", region: "GLOBAL" }, { symbol: "GBPUSD=X", region: "GLOBAL" }, { symbol: "USDJPY=X", region: "GLOBAL" },
   { symbol: "USDINR=X", region: "GLOBAL" }, { symbol: "AUDUSD=X", region: "GLOBAL" },
   // CRYPTO
   { symbol: "BTC-USD", region: "GLOBAL" }, { symbol: "ETH-USD", region: "GLOBAL" }, { symbol: "SOL-USD", region: "GLOBAL" },
   { symbol: "XRP-USD", region: "GLOBAL" }, { symbol: "ADA-USD", region: "GLOBAL" }, { symbol: "DOGE-USD", region: "GLOBAL" },
   // COMMODITIES
   { symbol: "GC=F", region: "GLOBAL" }, { symbol: "SI=F", region: "GLOBAL" }, { symbol: "CL=F", region: "GLOBAL" }, { symbol: "HG=F", region: "GLOBAL" }
];

export default function ExplorerPage() {
   const [activeFilter, setActiveFilter] = useState("ALL");
   const [searchQuery, setSearchQuery] = useState("");
   const [sortByVolatility, setSortByVolatility] = useState(false);
   const { currencySymbol, getConvertedPrice } = useCurrency();
   
   const [liveResults, setLiveResults] = useState<any[]>([]);
   const [isSearching, setIsSearching] = useState(false);
   const [hasSearched, setHasSearched] = useState(false);
   
   // Live Data for Featured Grid
   const [featuredAssets, setFeaturedAssets] = useState<any[]>([]);
   const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);

   // Swipe Mode State
   const [isQuickAddMode, setIsQuickAddMode] = useState(false);

   useEffect(() => {
     // Fetch live data for static grid on mount
     const fetchFeatured = async () => {
       try {
         const symbols = STATIC_ASSETS.map(a => a.symbol).join(',');
         const res = await fetch(`/api/batch-quotes?symbols=${encodeURIComponent(symbols)}`);
         const data = await res.json();
         if (data.quotes) {
           setFeaturedAssets(data.quotes);
         }
       } catch (err) {
         console.error("Featured fetch error", err);
       }
       setIsFeaturedLoading(false);
     };
     fetchFeatured();
   }, []);

   useEffect(() => {
     if (searchQuery.length < 1) {
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

   const isLiveMode = searchQuery.length >= 2;

   let filteredFeatured = featuredAssets.filter(a => {
      if (activeFilter === "ALL") return true;
      if (activeFilter === "INDIA") return a.region === "INDIA";
      if (activeFilter === "US") return a.region === "US";
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
                  <p className="text-gray-400 mt-1">Surf high-liquidity global structures. Search any stock, or use Quick Add to build portfolios.</p>
               </div>
               <div className="flex gap-4 w-full md:w-auto">
                 <button 
                   onClick={() => setIsQuickAddMode(!isQuickAddMode)}
                   className={`px-4 py-2 flex shrink-0 items-center gap-2 rounded-xl font-bold tracking-widest transition-all uppercase text-sm ${isQuickAddMode ? 'bg-[#34d74a] text-black shadow-[0_0_15px_rgba(52,215,74,0.3)]' : 'bg-[#111] text-gray-400 border border-[#262626] hover:text-white'}`}
                 >
                   <Layers size={18} /> Quick Add Mode
                 </button>
                 {!isQuickAddMode && (
                   <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-[10px] text-gray-500" size={18} />
                      <input 
                         type="text" 
                         placeholder="Search symbol..." 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="w-full bg-[#111] border border-[#262626] rounded-xl px-3 py-2 pl-10 text-white focus:outline-none focus:border-[#34d74a] text-sm"
                      />
                      {isSearching && <Loader2 className="absolute right-3 top-[10px] text-[#34d74a] animate-spin" size={18} />}
                   </div>
                 )}
               </div>
            </div>

            {isQuickAddMode ? (
               <SwipeDeck onExit={() => setIsQuickAddMode(false)} />
            ) : (
               <>
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#262626] mb-8 gap-4">
                    <div className="flex items-center overflow-x-auto no-scrollbar gap-2">
                       {['ALL', 'INDIA', 'US', 'EQUITY', 'FOREX', 'CRYPTO', 'COMMODITY'].map(f => (
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

                 {isLiveMode && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                                      </span>
                                   </div>
                                </div>
                             </div>
                           </Link>
                         );
                       })
                     ) : hasSearched && !isSearching ? (
                       <div className="col-span-4 text-center py-20 text-gray-500 border border-[#262626] rounded-2xl bg-[#050505]">
                          <Search className="mx-auto mb-4 opacity-50" size={32} />
                          <p className="font-medium tracking-wide">No assets found for &quot;{searchQuery}&quot;. Try a different ticker.</p>
                       </div>
                     ) : null}
                   </div>
                 )}

                 {!isLiveMode && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {isFeaturedLoading ? (
                        <div className="col-span-4 text-center py-20">
                          <Loader2 className="mx-auto text-[#34d74a] animate-spin mb-4" size={32} />
                          <p className="text-gray-500 font-mono text-sm">Syncing Live Market Feeds...</p>
                        </div>
                      ) : filteredFeatured.map(asset => {
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
                                     <p className="text-gray-400 mb-2 font-medium text-sm truncate">{asset.name}</p>
                                     <div className="flex justify-between items-end">
                                        <span className="text-3xl font-black text-white truncate pr-4">{currencySymbol}{convertedPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: (asset.type === 'CRYPTO' || asset.type === 'FOREX') ? 4 : 2})}</span>
                                        <span className="flex items-center gap-1 font-bold text-sm bg-[#111] px-2 py-1 rounded" style={{ color: isUp ? '#34d74a' : '#d73434' }}>
                                           {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                           {Math.abs(asset.change).toFixed(2)}%
                                        </span>
                                     </div>
                                  </div>
                               </div>
                            </Link>
                         );
                      })}
                   </div>
                 )}
               </>
            )}
         </div>
      </>
   );
}

// ---------------------------------------------------------
// INFINITE SWIPE DECK COMPONENT
// ---------------------------------------------------------
const MARKET_POOLS = {
  'S&P 500': ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "BRK.B", "LLY", "AVGO", "JPM", "V", "MA", "UNH", "XOM", "JNJ", "HD", "PG", "COST", "MRK", "ABBV", "CRM", "CVX", "NFLX", "AMD", "PEP", "KO", "WMT", "TMO", "MCD", "CSCO"],
  'NASDAQ': ["QQQ", "INTC", "CSCO", "CMCSA", "AMGN", "HON", "TXN", "ISRG", "SBUX", "MDLZ", "GILD", "INTU", "ADI", "REGN", "VRTX", "BKNG", "PANW", "ADP", "MU", "SNPS"],
  'NSE (Nifty)': ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "HINDUNILVR.NS", "LT.NS", "BAJFINANCE.NS", "HCLTECH.NS", "MARUTI.NS", "SUNPHARMA.NS", "TATAMOTORS.NS", "KOTAKBANK.NS", "ONGC.NS", "NTPC.NS", "TITAN.NS", "ULTRACEMCO.NS"],
  'BSE (Sensex)': ["RELIANCE.BO", "TCS.BO", "HDFCBANK.BO", "ICICIBANK.BO", "INFY.BO", "ITC.BO", "SBIN.BO", "BHARTIARTL.BO", "HINDUNILVR.BO", "LT.BO", "BAJFINANCE.BO", "HCLTECH.BO", "MARUTI.BO", "SUNPHARMA.BO", "TATAMOTORS.BO", "KOTAKBANK.BO"],
  'CRYPTO': ["BTC-USD", "ETH-USD", "BNB-USD", "SOL-USD", "XRP-USD", "ADA-USD", "AVAX-USD", "DOGE-USD", "DOT-USD", "LINK-USD", "MATIC-USD", "SHIB-USD", "LTC-USD", "BCH-USD", "UNI-USD"]
};

function SwipeDeck({ onExit }: { onExit: () => void }) {
  type MarketCategory = keyof typeof MARKET_POOLS;
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('S&P 500');
  
  const [deck, setDeck] = useState<any[]>([]);
  const [poolIndex, setPoolIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [animatingSwipe, setAnimatingSwipe] = useState<'left' | 'right' | null>(null);

  const [amountModal, setAmountModal] = useState<{ isOpen: boolean, asset: any | null }>({ isOpen: false, asset: null });
  const [sharesAmount, setSharesAmount] = useState('10');

  const THRESHOLD = 100;

  // Load live data for the active category in chunks
  useEffect(() => {
    setDeck([]);
    setPoolIndex(0);
    fetchNextBatch(activeCategory, 0);
  }, [activeCategory]);

  const fetchNextBatch = async (category: MarketCategory, startIndex: number) => {
    setIsLoading(true);
    const pool = MARKET_POOLS[category];
    const chunk = pool.slice(startIndex, startIndex + 10);
    
    if (chunk.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/batch-quotes?symbols=${encodeURIComponent(chunk.join(','))}`);
      const data = await res.json();
      if (data.quotes) {
        setDeck(prev => [...prev, ...data.quotes]);
        setPoolIndex(startIndex + 10);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  // Monitor deck size, if low, fetch more
  useEffect(() => {
    if (deck.length > 0 && deck.length <= 3 && !isLoading) {
      fetchNextBatch(activeCategory, poolIndex);
    }
  }, [deck.length, isLoading]);

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (deck.length === 0) return;
    setAnimatingSwipe(direction);
    
    setTimeout(() => {
      if (direction === 'right') {
        setAmountModal({ isOpen: true, asset: deck[0] });
      } else {
        setDeck(prev => prev.slice(1));
      }
      setAnimatingSwipe(null);
      setDragOffset({ x: 0, y: 0 });
    }, 300);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    
    if (dragOffset.x > THRESHOLD) {
      triggerSwipe('right');
    } else if (dragOffset.x < -THRESHOLD) {
      triggerSwipe('left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const confirmAdd = () => {
    alert(`Successfully added ${sharesAmount} shares of ${amountModal.asset?.symbol} to your portfolio!`);
    setAmountModal({ isOpen: false, asset: null });
    setDeck(prev => prev.slice(1));
    setSharesAmount('10');
  };

  const currentAsset = deck[0];
  const nextAsset = deck[1];

  let cardStyle: any = { transform: `translate(0px, 0px) rotate(0deg)`, transition: 'transform 0.3s ease-out' };
  
  if (isDragging) {
    cardStyle = { transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`, transition: 'none' };
  } else if (animatingSwipe === 'right') {
    cardStyle = { transform: `translate(800px, ${dragOffset.y}px) rotate(30deg)`, transition: 'transform 0.3s ease-out', opacity: 0 };
  } else if (animatingSwipe === 'left') {
    cardStyle = { transform: `translate(-800px, ${dragOffset.y}px) rotate(-30deg)`, transition: 'transform 0.3s ease-out', opacity: 0 };
  }

  return (
    <div className="flex flex-col items-center">
      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-8 pb-2 w-full justify-center">
         {Object.keys(MARKET_POOLS).map(cat => (
            <button 
               key={cat}
               onClick={() => setActiveCategory(cat as MarketCategory)}
               className={`px-6 py-2 rounded-xl font-bold text-sm tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-[#34d74a] text-black shadow-[0_0_15px_rgba(52,215,74,0.3)] border border-transparent' : 'bg-[#111] text-gray-500 hover:text-white border border-[#262626]'}`}
            >
               {cat}
            </button>
         ))}
      </div>

      <div className="relative h-[550px] w-full max-w-md mx-auto flex items-center justify-center perspective-1000">
        
        {deck.length === 0 && isLoading ? (
          <div className="flex flex-col items-center justify-center h-[500px] w-full border border-[#262626] rounded-3xl bg-[#0a0a0a]">
             <Loader2 className="text-[#34d74a] animate-spin mb-4" size={32} />
             <p className="text-gray-500 font-mono text-sm">Fetching Live Pipeline...</p>
          </div>
        ) : deck.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] w-full border border-[#262626] rounded-3xl bg-[#0a0a0a]">
             <Check className="text-[#34d74a] mb-4" size={48} />
             <h2 className="text-2xl font-bold text-white mb-2">Deck Completed</h2>
             <p className="text-gray-400 mb-6">You have swiped through all available assets in {activeCategory}.</p>
             <button onClick={onExit} className="px-6 py-3 bg-[#111] hover:bg-[#222] border border-[#262626] rounded-xl text-white font-bold transition-all">
                Return to Explorer
             </button>
          </div>
        ) : (
          <>
            {/* Background Card */}
            {nextAsset && (
              <div className="absolute w-full h-[500px] bg-[#050505] border border-[#262626] rounded-3xl opacity-50 scale-95 transform translate-y-4">
              </div>
            )}

            {/* Interactive Top Card */}
            <div 
              className="absolute w-full h-[500px] bg-[#0a0a0a] border border-[#262626] rounded-3xl shadow-2xl p-8 flex flex-col justify-between cursor-grab active:cursor-grabbing touch-none select-none z-10"
              style={cardStyle}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
               <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-[#111] px-2 py-1 rounded border border-[#262626]">
                      {currentAsset.region} / {currentAsset.type}
                    </span>
                    <h2 className="text-4xl font-black text-white mt-4 tracking-wider">{currentAsset.symbol}</h2>
                    <p className="text-lg text-gray-400 font-medium mt-1 truncate max-w-[200px]">{currentAsset.name}</p>
                  </div>
                  <Activity className="text-[#262626]" size={40} />
               </div>

               <div className="text-center py-10">
                  <div className="text-6xl font-black text-white">${currentAsset.price.toFixed(2)}</div>
                  <div className={`text-xl font-bold mt-2 ${currentAsset.change >= 0 ? 'text-[#34d74a]' : 'text-[#d73434]'}`}>
                     {currentAsset.change >= 0 ? '+' : ''}{currentAsset.change.toFixed(2)}%
                  </div>
               </div>

               <div className="flex justify-between items-center px-4 border-t border-[#262626] pt-6 pointer-events-auto">
                  <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => triggerSwipe('left')}>
                     <div className="w-14 h-14 rounded-full bg-[#111] border border-[#262626] flex items-center justify-center text-[#d73434] group-hover:bg-[#d73434] group-hover:text-black transition-colors">
                        <X size={24} />
                     </div>
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reject (Left)</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => triggerSwipe('right')}>
                     <div className="w-14 h-14 rounded-full bg-[#34d74a]/10 border border-[#34d74a]/30 flex items-center justify-center text-[#34d74a] group-hover:bg-[#34d74a] group-hover:text-black transition-colors">
                        <Check size={24} />
                     </div>
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Add (Right)</span>
                  </div>
               </div>

               {/* Visual overlay for intent */}
               {dragOffset.x > 50 && <div className="absolute inset-0 bg-[#34d74a]/10 rounded-3xl pointer-events-none transition-opacity border-4 border-[#34d74a]" />}
               {dragOffset.x < -50 && <div className="absolute inset-0 bg-[#d73434]/10 rounded-3xl pointer-events-none transition-opacity border-4 border-[#d73434]" />}
            </div>
          </>
        )}

        {/* Amount Modal */}
        {amountModal.isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
               <button onClick={() => setAmountModal({ isOpen: false, asset: null })} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                 <X size={20} />
               </button>
               <h3 className="text-xl font-bold text-white mb-2">Add to Portfolio</h3>
               <p className="text-gray-400 text-sm mb-6">How many shares of <span className="font-bold text-white">{amountModal.asset?.symbol}</span> would you like to track?</p>
               
               <input 
                 type="number" 
                 value={sharesAmount}
                 onChange={(e) => setSharesAmount(e.target.value)}
                 className="w-full bg-[#111] border border-[#262626] rounded-xl px-4 py-3 text-white text-lg font-mono mb-6 focus:border-[#34d74a] outline-none"
               />

               <button onClick={confirmAdd} className="w-full py-3 bg-[#34d74a] hover:bg-[#2bc43f] text-black font-black uppercase tracking-widest rounded-xl transition-colors">
                 Confirm Addition
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
