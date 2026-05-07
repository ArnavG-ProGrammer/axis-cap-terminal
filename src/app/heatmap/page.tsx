"use client";

import React, { useState, useEffect, useRef } from "react";
import { LayoutGrid } from "lucide-react";
import dynamic from "next/dynamic";

const CryptoCoinsHeatmap = dynamic(
  () => import("react-ts-tradingview-widgets").then((mod) => mod.CryptoCoinsHeatmap),
  { ssr: false }
);

// --- TRADINGVIEW IFRAME ---
function TradingViewHeatmapIframe({ blockSize, dataSource = "SPX500", exchanges = [] }: { blockSize?: string, dataSource?: string, exchanges?: string[] }) {
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
      dataSource: dataSource,
      blockSize: blockSize || "market_cap_basic",
      blockColor: "change",
      grouping: "sector",
      locale: "en",
      symbolUrl: "",
      colorTheme: "dark",
      exchanges: exchanges,
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
  }, [blockSize, dataSource, exchanges]);

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
          <TradingViewHeatmapIframe key="us" dataSource="SPX500" />
        ) : activeMarket === 'nse' ? (
          <TradingViewHeatmapIframe key="nse" dataSource="NIFTY50" exchanges={["NSE"]} />
        ) : (
          <TradingViewHeatmapIframe key="bse" dataSource="SENSEX" exchanges={["BSE"]} />
        )}
      </div>
    </div>
  );
}
