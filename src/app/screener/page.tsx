"use client";

import React, { useState } from "react";
import Head from "next/head";
import { SlidersHorizontal } from "lucide-react";
import dynamic from "next/dynamic";

const Screener = dynamic(
  () => import("react-ts-tradingview-widgets").then((mod) => mod.Screener),
  { ssr: false }
);

export default function ScreenerPage() {
  const [activeMarket, setActiveMarket] = useState<'america' | 'india' | 'forex' | 'crypto'>('america');

  const markets = [
    { key: 'america' as const, label: 'US Markets' },
    { key: 'india' as const, label: 'India (NSE/BSE)' },
    { key: 'forex' as const, label: 'Forex' },
    { key: 'crypto' as const, label: 'Crypto' },
  ];

  return (
    <>
      <Head>
        <title>Stock Screener | AXIS CAP</title>
      </Head>

      <div className="max-w-7xl mx-auto pb-20 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 border-b border-[#262626] pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <SlidersHorizontal className="text-[#34d74a]" size={28} /> Technical Screener
            </h1>
            <p className="text-gray-400 mt-1">Filter global securities by P/E, market cap, volume, performance, and technical indicators.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {markets.map(m => (
              <button
                key={m.key}
                onClick={() => setActiveMarket(m.key)}
                className={`px-5 py-2 rounded-xl font-bold text-sm tracking-wider transition-all border whitespace-nowrap ${
                  activeMarket === m.key
                    ? 'bg-[#34d74a] text-black border-transparent shadow-[0_0_15px_rgba(52,215,74,0.3)]'
                    : 'bg-[#111] text-gray-400 hover:text-white border-[#262626]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden shadow-2xl h-[700px]">
          <Screener
            key={activeMarket}
            colorTheme="dark"
            market={activeMarket}
            height="100%"
            width="100%"
          />
        </div>
      </div>
    </>
  );
}
