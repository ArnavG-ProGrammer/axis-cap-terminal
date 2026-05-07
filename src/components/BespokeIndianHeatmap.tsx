"use client";

import React, { useMemo, useState, useEffect } from "react";
import * as d3 from "d3-hierarchy";
import { ArrowLeft } from "lucide-react";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  value: number; // Market cap or volume
  sector: string;
}

interface HierarchyNode {
  name: string;
  type: "root" | "sector" | "stock";
  children?: HierarchyNode[];
  stock?: StockData;
  value?: number;
}

export default function BespokeIndianHeatmap({ exchange }: { exchange: 'NSE' | 'BSE' }) {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedSector, setZoomedSector] = useState<string | null>(null);
  const [hoveredStock, setHoveredStock] = useState<StockData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const nseSymbols = [
    "RELIANCE.NS","TCS.NS","HDFCBANK.NS","BHARTIARTL.NS","ICICIBANK.NS","INFY.NS","SBIN.NS","HINDUNILVR.NS","ITC.NS",
    "ADANIENT.NS","ADANIPORTS.NS","ASIANPAINT.NS","AXISBANK.NS","BAJFINANCE.NS","BAJAJFINSV.NS","BPCL.NS","CIPLA.NS",
    "COALINDIA.NS","DRREDDY.NS","EICHERMOT.NS","GRASIM.NS","HCLTECH.NS","HEROMOTOCO.NS","HINDALCO.NS","INDUSINDBK.NS",
    "JSWSTEEL.NS","KOTAKBANK.NS","LT.NS","MARUTI.NS","NESTLEIND.NS","NTPC.NS","ONGC.NS","POWERGRID.NS",
    "SBILIFE.NS","SUNPHARMA.NS","TATACONSUM.NS","TATAMOTORS.NS","TATASTEEL.NS","TECHM.NS","TITAN.NS","ULTRACEMCO.NS",
    "WIPRO.NS","HDFCLIFE.NS","BRITANNIA.NS","DIVISLAB.NS","APOLLOHOSP.NS","BAJAJ-AUTO.NS"
  ];

  const staticFallback: StockData[] = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2950.45, change: 1.25, value: 20e12, sector: 'Energy' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: 4120.30, change: -0.45, value: 15e12, sector: 'Technology' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1450.20, change: 0.85, value: 12e12, sector: 'Finance' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1080.15, change: 2.10, value: 8e12, sector: 'Finance' },
    { symbol: 'INFY', name: 'Infosys', price: 1540.00, change: -1.20, value: 6e12, sector: 'Technology' },
    { symbol: 'SBIN', name: 'State Bank of India', price: 780.50, change: 3.30, value: 5e12, sector: 'Finance' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1210.00, change: 1.50, value: 7e12, sector: 'Communication' },
    { symbol: 'ITC', name: 'ITC Limited', price: 430.25, change: -2.20, value: 5.5e12, sector: 'Consumer Goods' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', price: 2340.00, change: -0.70, value: 5.8e12, sector: 'Consumer Goods' },
    { symbol: 'LT', name: 'Larsen & Toubro', price: 3450.00, change: 0.90, value: 4.8e12, sector: 'Construction' }
  ];

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const symbols = exchange === 'NSE' ? nseSymbols : nseSymbols.map(s => s.replace('.NS', '.BO'));
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

  // Build Hierarchy
  const rootNode = useMemo(() => {
    if (!data.length) return null;

    let activeData = data;
    if (zoomedSector) {
      activeData = data.filter(d => (d.sector || 'Other') === zoomedSector);
    }

    const sectors: Record<string, HierarchyNode[]> = {};
    activeData.forEach(stock => {
      const s = stock.sector || 'Other';
      if (!sectors[s]) sectors[s] = [];
      sectors[s].push({
        name: stock.symbol,
        type: "stock",
        stock: stock,
        value: Math.max(stock.value || 1, 1)
      });
    });

    const children: HierarchyNode[] = Object.entries(sectors).map(([sectorName, stockNodes]) => {
      if (zoomedSector) {
        // If zoomed, we don't need a middle sector grouping, just append directly to root
        return stockNodes;
      }
      return {
        name: sectorName,
        type: "sector",
        children: stockNodes
      } as HierarchyNode;
    }).flat();

    const root: HierarchyNode = {
      name: "Market",
      type: "root",
      children: children
    };

    return d3.hierarchy<HierarchyNode>(root)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
  }, [data, zoomedSector]);

  // Calculate Treemap Math
  const leaves = useMemo(() => {
    if (!rootNode) return [];
    
    // We assume the container is roughly 1000x750, but we use percentages for rendering
    // so we just need an arbitrary high-resolution coordinate space.
    const treemapLayout = d3.treemap<HierarchyNode>()
      .size([1000, 750])
      .paddingInner(1) // gap between stocks
      .paddingOuter(zoomedSector ? 0 : 3) // gap around sectors
      .paddingTop(zoomedSector ? 0 : 20) // header room for sector label
      .round(true);

    treemapLayout(rootNode);
    return rootNode.leaves();
  }, [rootNode, zoomedSector]);

  // Sector Headers (Internal Nodes)
  const groups = useMemo(() => {
    if (!rootNode || zoomedSector) return [];
    // The immediate children of root are the sectors
    return rootNode.children || [];
  }, [rootNode, zoomedSector]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#050505] gap-6">
        <div className="w-16 h-16 border-4 border-[#089981]/20 border-t-[#089981] rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold text-sm tracking-widest uppercase animate-pulse">Computing Matrix...</p>
      </div>
    );
  }

  const getTvColor = (change: number) => {
    if (change > 2.5) return '#089981'; // Strong TV Green
    if (change > 0) return 'rgba(8, 153, 129, 0.7)'; // Weak Green
    if (change === 0) return '#434651'; // Grey
    if (change > -2.5) return 'rgba(242, 54, 69, 0.7)'; // Weak Red
    return '#f23645'; // Strong TV Red
  };

  return (
    <div className="h-full w-full bg-[#050505] flex flex-col font-sans select-none relative overflow-hidden" 
         onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      
      {/* Zoom Navigation Bar */}
      {zoomedSector && (
        <div className="bg-[#1e222d] border-b border-[#2b3139] p-2 flex items-center z-10 shadow-lg shrink-0">
          <button 
            onClick={() => setZoomedSector(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold uppercase tracking-wide px-3 py-1 rounded hover:bg-[#2b3139]"
          >
            <ArrowLeft size={16} /> Market Overview
          </button>
          <div className="mx-3 text-gray-600">/</div>
          <div className="text-white text-sm font-bold uppercase tracking-wider">{zoomedSector}</div>
        </div>
      )}

      {/* Treemap Container */}
      <div className="relative flex-1 w-full h-full p-1 overflow-hidden" style={{ perspective: '1000px' }}>
        
        {/* Render Sectors (Group Boxes & Headers) */}
        {!zoomedSector && groups.map((g, i) => {
          const w = ((g.x1 - g.x0) / 1000) * 100;
          const h = ((g.y1 - g.y0) / 750) * 100;
          const left = (g.x0 / 1000) * 100;
          const top = (g.y0 / 750) * 100;
          
          if (w < 0.1 || h < 0.1) return null;

          return (
            <div 
              key={`sector-${i}`}
              className="absolute border-[1.5px] border-[#1e222d] cursor-zoom-in hover:border-blue-500 transition-colors z-0"
              style={{
                left: `${left}%`, top: `${top}%`, width: `${w}%`, height: `${h}%`
              }}
              onClick={() => setZoomedSector(g.data.name)}
            >
              {/* Sector Title Tab */}
              {w > 5 && h > 4 && (
                 <div className="absolute top-0 left-0 px-2 py-[2px] bg-[#1e222d] text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider max-w-full truncate rounded-br">
                   {g.data.name}
                 </div>
              )}
            </div>
          );
        })}

        {/* Render Stocks (Leaves) */}
        {leaves.map((leaf, i) => {
          const w = ((leaf.x1 - leaf.x0) / 1000) * 100;
          const h = ((leaf.y1 - leaf.y0) / 750) * 100;
          const left = (leaf.x0 / 1000) * 100;
          const top = (leaf.y0 / 750) * 100;
          
          const stock = leaf.data.stock;
          if (!stock || w < 0.1 || h < 0.1) return null;

          const changeStr = stock.change > 0 ? `+${stock.change.toFixed(2)}%` : `${stock.change.toFixed(2)}%`;
          const displaySymbol = stock.symbol.split('.')[0];
          
          // Determine if box is big enough for text
          const showText = w > 3 && h > 4;
          const showChange = w > 4 && h > 6;

          return (
            <div 
              key={`leaf-${stock.symbol}-${i}`}
              className="absolute border border-[#050505] flex flex-col items-center justify-center text-white transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80 z-10 cursor-pointer overflow-hidden"
              style={{
                left: `${left}%`, 
                top: `${top}%`, 
                width: `${w}%`, 
                height: `${h}%`,
                backgroundColor: getTvColor(stock.change)
              }}
              onMouseEnter={() => setHoveredStock(stock)}
              onMouseLeave={() => setHoveredStock(null)}
              onClick={() => !zoomedSector && setZoomedSector(stock.sector)}
            >
              {showText && (
                <div className="font-bold tracking-tight px-1 text-center truncate w-full" style={{ fontSize: Math.min(w * 3, h * 3, 16) + 'px' }}>
                  {displaySymbol}
                </div>
              )}
              {showChange && (
                <div className="font-medium px-1 text-center truncate w-full opacity-90 mt-0.5" style={{ fontSize: Math.min(w * 2.5, h * 2.5, 13) + 'px' }}>
                  {changeStr}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Floating Tooltip */}
      {hoveredStock && (
        <div 
          className="fixed z-50 pointer-events-none bg-[#1e222d] border border-[#2b3139] shadow-2xl rounded-lg p-4 w-64 transform -translate-x-1/2 -translate-y-[120%]"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className="flex justify-between items-start mb-3 border-b border-[#2b3139] pb-2">
            <div>
              <div className="font-bold text-white text-base">{hoveredStock.symbol.split('.')[0]}</div>
              <div className="text-xs text-gray-400 mt-0.5 max-w-[150px] truncate">{hoveredStock.name}</div>
            </div>
            <div className={`text-sm font-bold ${hoveredStock.change > 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
              {hoveredStock.change > 0 ? '+' : ''}{hoveredStock.change.toFixed(2)}%
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Price</span>
              <span className="text-white font-mono">₹{hoveredStock.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Sector</span>
              <span className="text-white">{hoveredStock.sector}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
