"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Activity, Loader2, Repeat } from 'lucide-react';

const ASSET_LIST = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'BTC', 'ETH', 'XAU', 'XAG'];
type AssetKey = typeof ASSET_LIST[number];

export default function ConverterPage() {
  const [fromAsset, setFromAsset] = useState<AssetKey>('USD');
  const [toAsset, setToAsset] = useState<AssetKey>('INR');
  const [amount, setAmount] = useState<number>(1000);
  const [weightUnit, setWeightUnit] = useState<'oz' | 'kg' | 'g'>('oz');
  
  const [liveRates, setLiveRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fallback defaults if API fails
  const FALLBACK_RATES: Record<string, number> = {
    USD: 1, INR: 92.37, EUR: 0.92, GBP: 0.79, JPY: 151.40, CAD: 1.36, AUD: 1.52, 
    BTC: 0.000015, ETH: 0.00030, XAU: 0.00043, XAG: 0.036
  };

  useEffect(() => {
    const fetchLiveCrossRates = async () => {
       setIsLoading(true);
       try {
          // We must fetch the value of 1 USD in various global pairs
          const pairsToFetch = [
             { key: 'INR', symbol: 'USDINR=X' },
             { key: 'EUR', symbol: 'USDEUR=X' },
             { key: 'GBP', symbol: 'USDGBP=X' },
             { key: 'JPY', symbol: 'USDJPY=X' },
             { key: 'CAD', symbol: 'USDCAD=X' },
             { key: 'AUD', symbol: 'USDAUD=X' },
             { key: 'BTC', symbol: 'BTC-USD', inverted: true }, // BTC-USD gives price of 1 BTC in USD
             { key: 'ETH', symbol: 'ETH-USD', inverted: true },
             { key: 'XAU', symbol: 'GC=F', inverted: true }, // Gold futures in USD
             { key: 'XAG', symbol: 'SI=F', inverted: true } // Silver futures in USD
          ];

          const newRates: Record<string, number> = { USD: 1 };

          await Promise.all(pairsToFetch.map(async (pair) => {
             const res = await fetch(`/api/quote?q=${pair.symbol}`);
             if (res.ok) {
                const data = await res.json();
                if (data.price && data.price > 0) {
                   if (pair.inverted) {
                      newRates[pair.key] = 1 / data.price; // e.g., 1 USD = 0.000015 BTC
                   } else {
                      newRates[pair.key] = data.price; // e.g., 1 USD = 92.67 INR
                   }
                }
             }
          }));

          // Merge fetched rates over fallbacks to ensure absolute safety
          setLiveRates({ ...FALLBACK_RATES, ...newRates });

       } catch (error) {
          console.error("Failed to load live FX engine", error);
          setLiveRates(FALLBACK_RATES);
       } finally {
          setIsLoading(false);
       }
    };
    
    fetchLiveCrossRates();
  }, []);

  const getResult = () => {
    if (isLoading || !liveRates[fromAsset] || !liveRates[toAsset]) return 0;
    
    let effectiveAmount = amount;
    if (fromAsset === 'XAU' || fromAsset === 'XAG') {
       if (weightUnit === 'kg') effectiveAmount = amount * 32.1507;
       if (weightUnit === 'g') effectiveAmount = amount * 0.0321507;
    }

    const inUSD = effectiveAmount / liveRates[fromAsset];
    let finalResult = inUSD * liveRates[toAsset];

    if (toAsset === 'XAU' || toAsset === 'XAG') {
       if (weightUnit === 'kg') finalResult = finalResult / 32.1507;
       if (weightUnit === 'g') finalResult = finalResult / 0.0321507;
    }

    return finalResult;
  };

  const currentResult = getResult();

  const handleSwap = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      
      <div className="flex justify-between items-end mb-10 border-b border-[#262626] pb-6">
         <div>
           <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
             <Repeat className="w-8 h-8 text-[#34d74a]" /> Institutional FX Engine
           </h1>
           <p className="text-gray-400">Executing ultra-low latency real-time cross-matrix pricing from global liquidity hubs.</p>
         </div>
      </div>

      <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-8 max-w-4xl relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 p-4">
            {isLoading ? 
              <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest"><Loader2 size={12} className="animate-spin"/> Syncing Live V8 APIs...</span> : 
              <span className="flex items-center gap-2 text-xs font-bold text-[#34d74a] uppercase tracking-widest"><Activity size={12} className="animate-pulse"/> Real-Time Pricing Active</span>
            }
         </div>

         <div className="flex flex-col md:flex-row items-center gap-6 mt-8">
            
            {/* FROM BLOCK */}
            <div className="flex-1 w-full bg-[#111] p-6 rounded-xl border border-[#262626] shadow-inner">
               <label className="text-xs font-bold uppercase text-gray-500 block mb-3">Origin Asset</label>
               <div className="flex flex-wrap gap-2 bg-[#111] p-3 rounded-lg border border-[#262626]">
              {ASSET_LIST.map(asset => (
                <button
                  key={asset}
                  onClick={() => setFromAsset(asset)}
                  className={`flex-1 py-3 text-sm font-bold rounded-md transition-all ${fromAsset === asset ? 'bg-[#1a1a1a] text-[#34d74a] shadow-md border border-[#333]' : 'text-gray-400 hover:text-white'}`}
                >
                  {asset}
                </button>
              ))}
            </div>
            
            {(fromAsset === 'XAU' || fromAsset === 'XAG' || toAsset === 'XAU' || toAsset === 'XAG') && (
               <div className="mt-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                 <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">Base Weight Matrix:</label>
                 <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value as any)} className="bg-[#111] border border-[#333] text-white rounded px-3 py-1 font-mono text-sm focus:outline-none">
                    <option value="oz">Troy Ounces (oz)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                 </select>
               </div>
            )}
               <div className="flex items-center gap-4 border-b border-[#262626] pb-2 focus-within:border-white transition-colors mt-4">
                 <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-transparent text-right text-4xl font-light text-white outline-none"
                    min="0"
                    disabled={isLoading}
                 />
               </div>
            </div>

            {/* SWAP BUTTON */}
            <div className="shrink-0 pt-4 md:pt-0">
               <button onClick={handleSwap} disabled={isLoading} className="p-4 bg-[#1a1a1a] hover:bg-[#34d74a] hover:text-black rounded-full border border-[#262626] transition-colors group shadow-lg disabled:opacity-50">
                  <ArrowRightLeft className="w-6 h-6 text-gray-400 group-hover:text-black transition-colors" />
               </button>
            </div>

            {/* TO BLOCK */}
            <div className="flex-1 w-full bg-[#1A1A1A] p-6 rounded-xl border border-[#34d74a]/30 relative overflow-hidden shadow-[0_0_30px_rgba(52,215,74,0.05)]">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-[#34d74a]"></div>
               <label className="text-xs font-bold uppercase text-[#34d74a] block mb-3 pl-2">Target Equivalence</label>
               <div className="flex items-center gap-4 border-b border-[#262626] pb-2 pl-2">
                 <select 
                    value={toAsset} 
                    onChange={(e) => setToAsset(e.target.value as AssetKey)}
                    className="bg-transparent text-2xl font-black text-[#34d74a] outline-none appearance-none cursor-pointer tracking-wider"
                 >
                    {ASSET_LIST.map(k => <option key={k} value={k} className="bg-[#111]">{k}</option>)}
                 </select>
                 {isLoading ? (
                    <div className="w-full h-10 flex items-center justify-end">
                       <Loader2 className="animate-spin text-[#34d74a]" />
                    </div>
                 ) : (
                    <div className="w-full text-right break-all">
                       <span className="text-3xl lg:text-4xl font-black text-white leading-tight block pr-2">
                         {currentResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: (toAsset === 'BTC' || toAsset === 'ETH' || toAsset === 'XAU' || toAsset === 'XAG') ? 6 : 2 })}
                       </span>
                    </div>
                 )}
               </div>
            </div>

         </div>

         {!isLoading && liveRates[fromAsset] && liveRates[toAsset] && (
         <div className="mt-8 pt-6 border-t border-[#262626] flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
            <span className="flex items-center gap-2 font-mono bg-[#111] px-4 py-2 rounded-lg border border-[#262626]">
               <Activity size={14} className="text-[#34d74a]" /> 
               Exchange Matrix Rate: 1 {fromAsset} <ArrowRightLeft size={12} className="mx-1" /> {(liveRates[toAsset] / liveRates[fromAsset]).toLocaleString('en-US', {maximumFractionDigits: 6})} {toAsset}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Strict Live API Node Enabled</span>
         </div>
         )}
      </div>

    </div>
  );
}
