"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import { PieChart as PieChartIcon, Activity, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/components/CurrencyContext";

// Simple custom pie chart renderer for terminal aesthetic
const DonutSegment = ({ cumulativePercent, percent, color }: any) => {
  const dashArray = `${percent} ${100 - percent}`;
  const dashOffset = 25 - cumulativePercent;
  return (
    <circle
      cx="20"
      cy="20"
      r="15.91549430918954"
      fill="transparent"
      stroke={color}
      strokeWidth="6"
      strokeDasharray={dashArray}
      strokeDashoffset={dashOffset}
      className="transition-all duration-1000 ease-out"
    ></circle>
  );
};

export default function AssetsPage() {
  const { currencySymbol, multiplier } = useCurrency();
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
         setIsLoading(false);
         return; 
      }

      try {
         const { data, error } = await supabase
           .from('user_portfolios')
           .select('*')
           .eq('user_id', session.user.id);

         if (error) throw error;
         
         if (data && data.length > 0) {
            setPortfolioData(data);
         } else {
            // Keep empty representation accurately isolated
            setPortfolioData([]);
         }
      } catch (err) {
         console.warn("Table connection error or offline.", err);
         setPortfolioData([]);
      } finally {
         setIsLoading(false);
      }
    };
    
    fetchAssets();
  }, []);

  // Aggregation Logic
  const totalValue = portfolioData.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
  
  const aggregates = portfolioData.reduce((acc, curr) => {
     if (!acc[curr.type]) acc[curr.type] = 0;
     acc[curr.type] += (curr.qty * curr.price);
     return acc;
  }, {});

  const colors: Record<string, string> = {
     'Equities': '#34d74a',
     'Cryptocurrencies': '#d7b234',
     'Market Indices': '#4a34d7',
     'Commodities': '#d78b34',
     'Forex': '#d73434'
  };

  const categories = Object.keys(aggregates).map(type => ({
     name: type,
     value: aggregates[type],
     percent: totalValue > 0 ? (aggregates[type] / totalValue) * 100 : 0,
     color: colors[type] || '#888'
  })).sort((a,b) => b.value - a.value);

  let cumulative = 0;

  return (
    <>
      <Head>
        <title>Assets Allocation | AXIS CAP</title>
      </Head>

      <div className="max-w-7xl mx-auto pb-20 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-10 border-b border-[#262626] pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3 mb-2">
              <PieChartIcon className="text-[#34d74a]" size={28} /> Global Asset Allocation
            </h1>
            <p className="text-gray-400 mt-1">Cross-matrix structural risk distribution powered straight from the Supabase core.</p>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="text-xs text-gray-500 font-bold uppercase tracking-widest pb-1">Combined Portfolio AUM</div>
             {isLoading ? (
                <div className="h-10 flex items-center"><Loader2 className="animate-spin text-[#34d74a]" /></div>
             ) : (
                <div className="text-4xl font-black text-[#34d74a]">{currencySymbol}{(totalValue * multiplier).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           
           {/* Visual Ring Block */}
           <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden h-[400px]">
              {isLoading ? (
                 <Loader2 className="animate-spin text-gray-500 w-12 h-12" />
              ) : (
                 <>
                    <svg viewBox="0 0 40 40" className="w-64 h-64 -rotate-90 transform drop-shadow-[0_0_15px_rgba(52,215,74,0.1)]">
                       <circle cx="20" cy="20" r="15.915" fill="transparent" stroke="#111" strokeWidth="6"></circle>
                       {categories.map((c, i) => {
                          const el = <DonutSegment key={i} cumulativePercent={cumulative} percent={c.percent} color={c.color} />;
                          cumulative += c.percent;
                          return el;
                       })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-gray-500 text-xs font-bold uppercase tracking-widest bg-[#0a0a0a]">Assets</span>
                       <span className="text-white text-2xl font-black bg-[#0a0a0a] leading-none pt-1">{categories.length} Classes</span>
                    </div>
                 </>
              )}
           </div>

           {/* Metrics Legend Block */}
           <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-8 shadow-2xl flex flex-col justify-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#34d74a]/20"></div>
              <h3 className="text-sm text-gray-500 font-bold uppercase tracking-widest border-b border-[#262626] pb-2 mb-2">Exposure Distribution</h3>
              
              {isLoading ? (
                 <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-[#34d74a]" /></div>
              ) : (
                 categories.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-[#262626] group hover:border-gray-500 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: c.color }}></div>
                          <span className="text-white font-bold text-sm tracking-wider">{c.name}</span>
                       </div>
                       <div className="flex items-center gap-6">
                          <span className="text-gray-400 font-mono text-sm">{currencySymbol}{(c.value * multiplier).toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
                          <span className="w-16 text-right font-black" style={{ color: c.color }}>{c.percent.toFixed(1)}%</span>
                       </div>
                    </div>
                 ))
              )}
              {!isLoading && categories.length === 0 && (
                 <div className="text-gray-500 text-sm mt-4">No active footprint found in the database.</div>
              )}
           </div>

        </div>

      </div>
    </>
  );
}
