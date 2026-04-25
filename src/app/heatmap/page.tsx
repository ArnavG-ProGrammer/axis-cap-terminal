"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { LayoutGrid } from "lucide-react";
import dynamic from "next/dynamic";

const CryptoCoinsHeatmap = dynamic(
  () => import("react-ts-tradingview-widgets").then((mod) => mod.CryptoCoinsHeatmap),
  { ssr: false }
);

// --- NATIVE AXIS CAP HEATMAP (YAHOO FINANCE POWERED) ---
function YahooHeatmap({ exchange }: { exchange: 'NSE' | 'BSE' }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nseSymbols = [
    "RELIANCE.NS","TCS.NS","HDFCBANK.NS","BHARTIARTL.NS","ICICIBANK.NS","INFY.NS","SBIN.NS","HINDUNILVR.NS","ITC.NS",
    "ADANIENT.NS","ADANIPORTS.NS","ASIANPAINT.NS","AXISBANK.NS","BAJFINANCE.NS","BAJAJFINSV.NS","BPCL.NS","CIPLA.NS",
    "COALINDIA.NS","DRREDDY.NS","EICHERMOT.NS","GRASIM.NS","HCLTECH.NS","HEROMOTOCO.NS","HINDALCO.NS","INDUSINDBK.NS",
    "JSWSTEEL.NS","KOTAKBANK.NS","LT.NS","MARUTI.NS","NESTLEIND.NS","NTPC.NS","ONGC.NS","POWERGRID.NS",
    "SBILIFE.NS","SUNPHARMA.NS","TATACONSUM.NS","TATAMOTORS.NS","TATASTEEL.NS","TECHM.NS","TITAN.NS","ULTRACEMCO.NS",
    "WIPRO.NS","HDFCLIFE.NS","BRITANNIA.NS","DIVISLAB.NS","APOLLOHOSP.NS","BAJAJ-AUTO.NS"
  ];

  const bseSymbols = nseSymbols.map(s => s.replace('.NS', '.BO'));

  const staticFallback = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2950.45, change: 1.25, value: 20e12, sector: 'Energy' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: 4120.30, change: -0.45, value: 15e12, sector: 'Technology' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1450.20, change: 0.85, value: 12e12, sector: 'Finance' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1080.15, change: 2.10, value: 8e12, sector: 'Finance' },
    { symbol: 'INFY', name: 'Infosys', price: 1540.00, change: -1.20, value: 6e12, sector: 'Technology' },
    { symbol: 'SBIN', name: 'State Bank of India', price: 780.50, change: 0.30, value: 5e12, sector: 'Finance' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1210.00, change: 1.50, value: 7e12, sector: 'Communication' },
    { symbol: 'ITC', name: 'ITC Limited', price: 430.25, change: -0.20, value: 5.5e12, sector: 'Consumer Goods' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', price: 2340.00, change: -0.70, value: 5.8e12, sector: 'Consumer Goods' },
    { symbol: 'LT', name: 'Larsen & Toubro', price: 3450.00, change: 0.90, value: 4.8e12, sector: 'Construction' }
  ];

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const symbols = exchange === 'NSE' ? nseSymbols : bseSymbols;
        const res = await fetch(`/api/heatmap-data?symbols=${symbols.join(',')}`);
        const json = await res.json();
        if (isMounted && json.data && json.data.length > 0) {
          setData(json.data);
        } else if (isMounted) {
          setData(staticFallback.map(s => ({ ...s, symbol: exchange === 'NSE' ? s.symbol + '.NS' : s.symbol + '.BO' })));
        }
      } catch (e) {
        if (isMounted) setData(staticFallback.map(s => ({ ...s, symbol: exchange === 'NSE' ? s.symbol + '.NS' : s.symbol + '.BO' })));
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [exchange]);

  const groupedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const sectors: Record<string, any[]> = {};
    data.forEach(stock => {
      if (!stock) return;
      const s = stock.sector || 'Other';
      if (!sectors[s]) sectors[s] = [];
      sectors[s].push(stock);
    });
    return Object.entries(sectors).sort((a, b) => b[1].length - a[1].length);
  }, [data]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-6">
        <div className="w-16 h-16 border-4 border-[#34d74a]/10 border-t-[#34d74a] rounded-full animate-spin"></div>
        <p className="text-white font-bold text-sm tracking-widest uppercase animate-pulse">Initializing Data Stream...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#050505] p-6 overflow-y-auto custom-scrollbar">
      <div className="space-y-12">
        {groupedData.map(([sector, stocks]) => (
          <div key={sector} className="space-y-4">
            <h3 className="text-gray-500 font-black text-[11px] uppercase tracking-[0.25em] flex items-center gap-3">
              {sector} <span className="w-full h-[1px] bg-white/5"></span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {stocks.sort((a,b) => (b.value || 0) - (a.value || 0)).map((stock) => {
                const val = stock.change || 0;
                const isPositive = val >= 0;
                const intensity = Math.min(Math.abs(val) * 20, 100);
                const bgColor = isPositive 
                  ? `rgba(52, 215, 74, ${Math.max(intensity / 100, 0.25)})`
                  : `rgba(215, 52, 52, ${Math.max(intensity / 100, 0.25)})`;
                const displaySymbol = (stock.symbol || '').split('.')[0];
                const logoUrl = `https://logo.clearbit.com/${displaySymbol.toLowerCase()}.com`;

                return (
                  <div 
                    key={stock.symbol}
                    className="group relative h-28 flex flex-col items-center justify-center rounded-xl border border-white/5 transition-all hover:scale-[1.02] hover:z-10 cursor-pointer overflow-hidden shadow-lg"
                    style={{ backgroundColor: bgColor }}
                  >
                    <div className="w-8 h-8 rounded-full bg-black/30 mb-2 flex items-center justify-center overflow-hidden border border-white/10">
                      <img 
                        src={logoUrl} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[10px] font-black text-white/40">${displaySymbol[0]}</span>`;
                        }}
                      />
                    </div>
                    <span className="text-white font-black text-sm tracking-tight">{displaySymbol}</span>
                    <span className={`text-[10px] font-bold ${isPositive ? 'text-[#34d74a]' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{val.toFixed(2)}%
                    </span>
                    
                    {/* Tooltip */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all bg-black/95 backdrop-blur-md flex flex-col justify-center p-4 text-[10px] font-mono z-50">
                       <p className="text-[#34d74a] font-black truncate mb-2 border-b border-white/10 pb-2">{stock.name}</p>
                       <div className="flex justify-between text-gray-500 mb-1"><span>PRICE</span><span className="text-white font-bold">₹{(stock.price || 0).toLocaleString()}</span></div>
                       <div className="flex justify-between text-gray-500 mb-1"><span>MKT CAP</span><span className="text-white font-bold">₹{((stock.value || 0) / 1e12).toFixed(2)}T</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- TRADINGVIEW IFRAME ---
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
    script.innerHTML = JSON.stringify({
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
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [blockSize]);

  return <div className="tradingview-widget-container h-full w-full" ref={containerRef} />;
}

export default function HeatmapPage() {
  const [activeMarket, setActiveMarket] = useState<'us' | 'nse' | 'bse' | 'crypto'>('nse');

  const markets = [
    { key: 'nse' as const, label: 'NSE (India)' },
    { key: 'bse' as const, label: 'BSE (India)' },
    { key: 'us' as const, label: 'US Stocks' },
    { key: 'crypto' as const, label: 'Crypto' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-[#262626] pb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-4">
            <LayoutGrid className="text-[#34d74a]" size={36} /> MARKET HEATMAP
          </h1>
          <p className="text-gray-500 mt-2 font-medium tracking-wide uppercase text-xs">Custom Quantitative Institutional Feed • Live Proportional Analysis</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {markets.map(m => (
            <button
              key={m.key}
              onClick={() => setActiveMarket(m.key)}
              className={`px-6 py-3 rounded-2xl font-black text-xs tracking-[0.1em] uppercase transition-all border ${
                activeMarket === m.key
                  ? 'bg-[#34d74a] text-black border-transparent shadow-[0_0_20px_rgba(52,215,74,0.4)]'
                  : 'bg-[#111] text-gray-500 hover:text-white border-[#262626]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] h-[750px] relative">
        {activeMarket === 'crypto' ? (
          <CryptoCoinsHeatmap key="crypto" colorTheme="dark" height="100%" width="100%" />
        ) : activeMarket === 'us' ? (
          <TradingViewHeatmapIframe key="us" />
        ) : (
          <YahooHeatmap exchange={activeMarket.toUpperCase() as any} />
        )}
      </div>
    </div>
  );
}
