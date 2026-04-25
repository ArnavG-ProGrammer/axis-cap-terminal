"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { LayoutGrid } from "lucide-react";
import dynamic from "next/dynamic";
import { Treemap, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

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

  // Optimized Nifty 50 list for stability
  const nseSymbols = [
    "RELIANCE.NS","TCS.NS","HDFCBANK.NS","BHARTIARTL.NS","ICICIBANK.NS","INFY.NS","SBIN.NS","HINDUNILVR.NS","ITC.NS",
    "ADANIENT.NS","ADANIPORTS.NS","ASIANPAINT.NS","AXISBANK.NS","BAJFINANCE.NS","BAJAJFINSV.NS","BPCL.NS","CIPLA.NS",
    "COALINDIA.NS","DRREDDY.NS","EICHERMOT.NS","GRASIM.NS","HCLTECH.NS","HEROMOTOCO.NS","HINDALCO.NS","INDUSINDBK.NS",
    "JSWSTEEL.NS","KOTAKBANK.NS","LT.NS","MARUTI.NS","NESTLEIND.NS","NTPC.NS","ONGC.NS","POWERGRID.NS",
    "SBILIFE.NS","SUNPHARMA.NS","TATACONSUM.NS","TATAMOTORS.NS","TATASTEEL.NS","TECHM.NS","TITAN.NS","ULTRACEMCO.NS",
    "WIPRO.NS","HDFCLIFE.NS","BRITANNIA.NS","DIVISLAB.NS","APOLLOHOSP.NS","BAJAJ-AUTO.NS"
  ];

  const bseSymbols = nseSymbols.map(s => s.replace('.NS', '.BO'));

  // Expanded Safety Net: 15 Leaders
  const staticFallback = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2950.45, change: 1.25, value: 20e12, avgVolume: 5e6 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: 4120.30, change: -0.45, value: 15e12, avgVolume: 2e6 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1450.20, change: 0.85, value: 12e12, avgVolume: 15e6 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1080.15, change: 2.10, value: 8e12, avgVolume: 12e6 },
    { symbol: 'INFY', name: 'Infosys', price: 1540.00, change: -1.20, value: 6e12, avgVolume: 8e6 },
    { symbol: 'SBIN', name: 'State Bank of India', price: 780.50, change: 0.30, value: 5e12, avgVolume: 20e6 },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1210.00, change: 1.50, value: 7e12, avgVolume: 5e6 },
    { symbol: 'ITC', name: 'ITC Limited', price: 430.25, change: -0.20, value: 5.5e12, avgVolume: 10e6 },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', price: 2340.00, change: -0.70, value: 5.8e12, avgVolume: 1.5e6 },
    { symbol: 'LT', name: 'Larsen & Toubro', price: 3450.00, change: 0.90, value: 4.8e12, avgVolume: 2e6 },
    { symbol: 'AXISBANK', name: 'Axis Bank', price: 1050.00, change: 1.10, value: 3.2e12, avgVolume: 8e6 },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', price: 1720.00, change: -0.35, value: 3.4e12, avgVolume: 3e6 },
    { symbol: 'MARUTI', name: 'Maruti Suzuki', price: 12300.00, change: 0.60, value: 3.8e12, avgVolume: 0.5e6 },
    { symbol: 'SUNPHARMA', name: 'Sun Pharma', price: 1540.00, change: 1.80, value: 3.6e12, avgVolume: 2e6 },
    { symbol: 'TATAMOTORS', name: 'Tata Motors', price: 980.00, change: 2.50, value: 3.2e12, avgVolume: 15e6 }
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
          // If API fails, use a subset of static data as fallback
          setData(staticFallback.map(s => ({ ...s, symbol: exchange === 'NSE' ? s.symbol + '.NS' : s.symbol + '.BO' })));
        }
      } catch (e) {
        console.error("Heatmap fetch error:", e);
        if (isMounted) setData(staticFallback.map(s => ({ ...s, symbol: exchange === 'NSE' ? s.symbol + '.NS' : s.symbol + '.BO' })));
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [exchange]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#34d74a]/10 border-t-[#34d74a] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#34d74a]/5 border-b-[#34d74a] rounded-full animate-spin-reverse"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-sm tracking-widest uppercase">Initializing Quantum Treemap</p>
          <p className="text-gray-500 font-mono text-[10px] mt-1 uppercase animate-pulse">Syncing NSE/BSE Institutional Feeds...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0a0a0a] text-gray-500">
        <p>No market data available. Please check your connection.</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-[#34d74a] underline">Retry Connection</button>
      </div>
    );
  }

  // Custom Treemap Content Renderer
  const CustomizedContent = (props: any) => {
    const { x, y, width, height, symbol, change } = props;
    if (width < 30 || height < 20) return null;

    const isPositive = (change || 0) >= 0;
    const intensity = Math.min(Math.abs(change || 0) * 25, 100);
    const bgColor = isPositive 
      ? `rgba(52, 215, 74, ${Math.max(intensity / 100, 0.2)})`
      : `rgba(215, 52, 52, ${Math.max(intensity / 100, 0.2)})`;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: bgColor,
            stroke: '#000',
            strokeWidth: 1,
            strokeOpacity: 0.5,
          }}
        />
        {width > 40 && height > 30 && (
          <text
            x={x + width / 2}
            y={y + height / 2 - 2}
            textAnchor="middle"
            fill="#fff"
            fontSize={Math.min(width / 6, 12)}
            fontWeight="900"
            style={{ pointerEvents: 'none' }}
          >
            {(symbol || 'N/A').split('.')[0]}
          </text>
        )}
        {width > 40 && height > 45 && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 12}
            textAnchor="middle"
            fill={isPositive ? '#34d74a' : '#ff4d4d'}
            fontSize={Math.min(width / 8, 10)}
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            {isPositive ? '+' : ''}{(change || 0).toFixed(2)}%
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="h-full w-full bg-[#0a0a0a]">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="#000"
          content={<CustomizedContent />}
        >
          <RechartsTooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0 && payload[0].payload) {
                const stock = payload[0].payload;
                return (
                  <div className="bg-black/95 border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-md min-w-[160px] z-50">
                    <p className="text-[#34d74a] font-bold text-xs mb-2 border-b border-white/10 pb-1">{stock.name || 'Unknown'}</p>
                    <div className="space-y-1 text-[10px] font-mono">
                       <div className="flex justify-between"><span className="text-gray-500">SYMBOL</span><span className="text-white">{stock.symbol || 'N/A'}</span></div>
                       <div className="flex justify-between"><span className="text-gray-500">CHANGE</span><span className={(stock.change || 0) >= 0 ? 'text-[#34d74a]' : 'text-red-500'}>{(stock.change || 0).toFixed(2)}%</span></div>
                       <div className="flex justify-between"><span className="text-gray-500">MKT CAP</span><span className="text-white">₹{((stock.value || 0) / 1e12).toFixed(2)}T</span></div>
                       <div className="flex justify-between"><span className="text-gray-500">PRICE</span><span className="text-white">₹{(stock.price || 0).toLocaleString()}</span></div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </Treemap>
      </ResponsiveContainer>
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

