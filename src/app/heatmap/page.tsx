"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { LayoutGrid } from "lucide-react";
import dynamic from "next/dynamic";

const CryptoCoinsHeatmap = dynamic(
  () => import("react-ts-tradingview-widgets").then((mod) => mod.CryptoCoinsHeatmap),
  { ssr: false }
);

// TradingView Heatmap via iframe
function TradingViewHeatmapIframe({ blockSize }: { blockSize?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    containerRef.current.innerHTML = '';
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget h-full w-full';
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;

    const config: any = {
      dataSource: "SPX500",
      blockSize: blockSize || "market_cap_basic",
      blockColor: "change",
      grouping: "sector",
      locale: "en",
      symbolUrl: "",
      colorTheme: "dark",
      exchanges: [],
      hasTopBar: true,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: "100%",
    };

    script.innerHTML = JSON.stringify(config);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [blockSize]);

  return <div className="tradingview-widget-container h-full w-full" ref={containerRef} />;
}

// --- NATIVE AXIS CAP HEATMAP (YAHOO FINANCE POWERED) ---
function YahooHeatmap({ exchange }: { exchange: 'NSE' | 'BSE' }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Top 50 Indian Stocks by Market Cap for the Heatmap
  const nseSymbols = [
    "RELIANCE.NS","TCS.NS","HDFCBANK.NS","BHARTIARTL.NS","ICICIBANK.NS","INFY.NS","SBIN.NS","HINDUNILVR.NS","ITC.NS",
    "ADANIENT.NS","ADANIPORTS.NS","ASIANPAINT.NS","AXISBANK.NS","BAJFINANCE.NS","BAJAJFINSV.NS","BPCL.NS","CIPLA.NS",
    "COALINDIA.NS","DRREDDY.NS","EICHERMOT.NS","GRASIM.NS","HCLTECH.NS","HEROMOTOCO.NS","HINDALCO.NS","INDUSINDBK.NS",
    "JSWSTEEL.NS","KOTAKBANK.NS","LT.NS","M&M.NS","MARUTI.NS","NESTLEIND.NS","NTPC.NS","ONGC.NS","POWERGRID.NS",
    "SBILIFE.NS","SUNPHARMA.NS","TATACONSUM.NS","TATAMOTORS.NS","TATASTEEL.NS","TECHM.NS","TITAN.NS","ULTRACEMCO.NS",
    "WIPRO.NS","HDFCLIFE.NS","BRITANNIA.NS","DIVISLAB.NS","APOLLOHOSP.NS","SHREECEM.NS","BAJAJ-AUTO.NS"
  ];

  const bseSymbols = nseSymbols.map(s => s.replace('.NS', '.BO'));

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const symbols = exchange === 'NSE' ? nseSymbols : bseSymbols;
        const res = await fetch(`/api/heatmap-data?symbols=${symbols.join(',')}`);
        const json = await res.json();
        if (json.data) setData(json.data);
      } catch (e) {
        console.error("Heatmap fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [exchange]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-4">
        <div className="w-12 h-12 border-4 border-[#34d74a]/20 border-t-[#34d74a] rounded-full animate-spin"></div>
        <p className="text-gray-500 font-mono text-sm animate-pulse">Aggregating Institutional Market Data...</p>
      </div>
    );
  }

  // Simple Treemap Logic: Divide space based on Market Cap
  // We'll use a CSS Grid-based masonry or a flexbox approach for maximum control
  const totalWeight = data.reduce((sum, item) => sum + (item.value || 0), 0);
  
  return (
    <div className="h-full w-full p-2 bg-[#0a0a0a] overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 h-full overflow-y-auto custom-scrollbar">
         {data.sort((a,b) => b.value - a.value).map((stock) => {
           const isPositive = stock.change >= 0;
           // Color intensity based on performance
           const intensity = Math.min(Math.abs(stock.change) * 20, 100);
           const bgColor = isPositive 
             ? `rgba(52, 215, 74, ${Math.max(intensity / 100, 0.15)})`
             : `rgba(215, 52, 52, ${Math.max(intensity / 100, 0.15)})`;
           const borderColor = isPositive ? '#34d74a44' : '#d7343444';

           return (
             <div 
               key={stock.symbol}
               className="group relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all hover:scale-[1.02] hover:z-10 cursor-pointer overflow-hidden"
               style={{ 
                 backgroundColor: bgColor, 
                 borderColor: borderColor,
                 // Size weighting can be done here if using a more complex layout, 
                 // but for now a solid uniform grid with sorting is the cleanest performance for 50+ stocks
               }}
             >
               <div className="text-center">
                 <span className="block text-white font-black text-sm tracking-tighter truncate max-w-full">{stock.symbol.replace('.NS', '').replace('.BO', '')}</span>
                 <span className={`text-[11px] font-bold ${isPositive ? 'text-[#34d74a]' : 'text-[#d73434]'}`}>
                   {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
                 </span>
               </div>
               
               {/* Institutional Tooltip */}
               <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 backdrop-blur-sm flex flex-col justify-center p-4 text-[10px] font-mono z-20">
                 <p className="text-[#34d74a] font-bold truncate mb-1">{stock.name}</p>
                 <div className="flex justify-between border-b border-white/10 pb-1 mb-1">
                   <span className="text-gray-500">PRICE</span>
                   <span className="text-white">₹{stock.price.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between border-b border-white/10 pb-1 mb-1">
                   <span className="text-gray-500">MKT CAP</span>
                   <span className="text-white">₹{(stock.value / 1e12).toFixed(2)}T</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-500">VOL (3M)</span>
                   <span className="text-white">{(stock.avgVolume / 1e6).toFixed(1)}M</span>
                 </div>
               </div>
             </div>
           );
         })}
      </div>
    </div>
  );
}

export default function HeatmapPage() {
  const [activeMarket, setActiveMarket] = useState<'us' | 'nse' | 'bse' | 'crypto'>('nse');
  const [blockSize, setBlockSize] = useState<string>('market_cap_basic');

  const markets = [
    { key: 'nse' as const, label: 'NSE (India)' },
    { key: 'bse' as const, label: 'BSE (India)' },
    { key: 'us' as const, label: 'US Stocks' },
    { key: 'crypto' as const, label: 'Crypto' },
  ];

  const sizingOptions = [
    { key: 'market_cap_basic', label: 'Market Cap' },
    { key: 'volume|1', label: 'Volume' },
    { key: 'number_of_employees', label: 'Employees' },
    { key: 'dividend_yield_recent', label: 'Dividend Yield' },
  ];

  return (
    <>
      <Head>
        <title>Market Heatmap | AXIS CAP</title>
      </Head>

      <div className="max-w-7xl mx-auto pb-20 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 border-b border-[#262626] pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <LayoutGrid className="text-[#34d74a]" size={28} /> Market Heatmap
            </h1>
            <p className="text-gray-400 mt-1">AXIS Custom Quantitative treemap powered by live Yahoo Finance institutional data streams.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {markets.map(m => (
                <button
                  key={m.key}
                  onClick={() => setActiveMarket(m.key)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all border ${
                    activeMarket === m.key
                      ? 'bg-[#34d74a] text-black border-transparent shadow-[0_0_15px_rgba(52,215,74,0.3)]'
                      : 'bg-[#111] text-gray-400 hover:text-white border-[#262626]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {(activeMarket === 'us' || activeMarket === 'crypto') && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mr-1">Size By:</span>
                {sizingOptions.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setBlockSize(s.key)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[10px] tracking-wider transition-all border ${
                      blockSize === s.key
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-transparent text-gray-500 hover:text-white border-transparent'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden shadow-2xl h-[700px]">
          {activeMarket === 'crypto' ? (
            <CryptoCoinsHeatmap key="crypto" colorTheme="dark" height="100%" width="100%" />
          ) : activeMarket === 'us' ? (
            <TradingViewHeatmapIframe
              key={`${activeMarket}-${blockSize}`}
              blockSize={blockSize}
            />
          ) : (
            <YahooHeatmap exchange={activeMarket.toUpperCase() as any} />
          )}
        </div>
      </div>
    </>
  );
}

