"use client";

import React, { useState } from "react";
import Head from "next/head";
import { LayoutGrid } from "lucide-react";
import dynamic from "next/dynamic";

const StockHeatmap = dynamic(
  () => import("react-ts-tradingview-widgets").then((mod) => mod.StockHeatmap),
  { ssr: false }
);
const CryptoCoinsHeatmap = dynamic(
  () => import("react-ts-tradingview-widgets").then((mod) => mod.CryptoCoinsHeatmap),
  { ssr: false }
);

export default function HeatmapPage() {
  const [activeMarket, setActiveMarket] = useState<'stocks' | 'crypto'>('stocks');

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveMarket('stocks')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all border ${
                activeMarket === 'stocks'
                  ? 'bg-[#34d74a] text-black border-transparent shadow-[0_0_15px_rgba(52,215,74,0.3)]'
                  : 'bg-[#111] text-gray-400 hover:text-white border-[#262626]'
              }`}
            >
              Stocks
            </button>
            <button
              onClick={() => setActiveMarket('crypto')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all border ${
                activeMarket === 'crypto'
                  ? 'bg-[#34d74a] text-black border-transparent shadow-[0_0_15px_rgba(52,215,74,0.3)]'
                  : 'bg-[#111] text-gray-400 hover:text-white border-[#262626]'
              }`}
            >
              Crypto
            </button>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden shadow-2xl h-[700px]">
          {activeMarket === 'stocks' ? (
            <StockHeatmap colorTheme="dark" height="100%" width="100%" />
          ) : (
            <CryptoCoinsHeatmap colorTheme="dark" height="100%" width="100%" />
          )}
        </div>
      </div>
    </>
  );
}
