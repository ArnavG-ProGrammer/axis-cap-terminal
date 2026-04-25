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
function TradingViewHeatmapIframe({ exchange, blockSize }: { exchange?: string; blockSize?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear any previous widget remnants
    containerRef.current.innerHTML = '';
    
    // Create new inner element for TradingView to safely re-bind
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget h-full w-full';
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;

    let dataSource = exchange ? exchange : "SPX500";
    let exchanges = [];
    
    if (exchange === 'NSE' || exchange === 'BSE') {
      dataSource = "AllINR";
      // For Indian markets, TradingView often requires 'exchanges' to be empty or specifically set.
      // We'll stick to the user's structure of exchanges: [] for now.
    }

    const config: any = {
      dataSource: dataSource,
      blockSize: blockSize || "market_cap_basic",
      blockColor: "change",
      grouping: "sector",
      locale: "en",
      symbolUrl: "",
      colorTheme: "dark",
      exchanges: [],
      hasTopBar: true,
      isDataSetEnabled: false, // User provided false for SP500
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
  }, [exchange, blockSize]);

  return <div className="tradingview-widget-container h-full w-full" ref={containerRef} />;
}

export default function HeatmapPage() {
  const [activeMarket, setActiveMarket] = useState<'us' | 'nse' | 'bse' | 'crypto'>('us');
  const [blockSize, setBlockSize] = useState<string>('market_cap_basic');

  const markets = [
    { key: 'us' as const, label: 'US Stocks' },
    { key: 'nse' as const, label: 'NSE (India)' },
    { key: 'bse' as const, label: 'BSE (India)' },
    { key: 'crypto' as const, label: 'Crypto' },
  ];

  const sizingOptions = [
    { key: 'market_cap_basic', label: 'Market Cap' },
    { key: 'volume|1', label: 'Volume' },
    { key: 'number_of_employees', label: 'Employees' },
    { key: 'dividend_yield_recent', label: 'Dividend Yield' },
  ];

  const exchangeMap: Record<string, string | undefined> = {
    us: undefined,
    nse: 'NSE',
    bse: 'BSE',
  };

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
            <p className="text-gray-400 mt-1">Visual treemap of global market sectors showing performance, market cap weighting, and momentum at a glance.</p>
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
            {activeMarket !== 'crypto' && (
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
          ) : (
            <TradingViewHeatmapIframe
              key={`${activeMarket}-${blockSize}`}
              exchange={exchangeMap[activeMarket]}
              blockSize={blockSize}
            />
          )}
        </div>
      </div>
    </>
  );
}
