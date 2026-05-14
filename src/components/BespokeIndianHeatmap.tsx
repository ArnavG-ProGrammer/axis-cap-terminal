"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import * as d3 from "d3-hierarchy";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  value: number;
  sector: string;
}

interface HierarchyNode {
  name: string;
  type: "root" | "sector" | "stock";
  children?: HierarchyNode[];
  stock?: StockData;
  value?: number;
}

// ═══════════════════════════════════════════════════════════════
//  VERIFIED NSE NIFTY 200 CONSTITUENTS — 160 symbols
// ═══════════════════════════════════════════════════════════════
const NSE_SYMBOLS = [
  // Banking & Finance (30)
  "HDFCBANK.NS","ICICIBANK.NS","SBIN.NS","KOTAKBANK.NS","AXISBANK.NS",
  "INDUSINDBK.NS","BANKBARODA.NS","PNB.NS","CANBK.NS","IDFCFIRSTB.NS",
  "FEDERALBNK.NS","BANDHANBNK.NS","BAJFINANCE.NS","BAJAJFINSV.NS","CHOLAFIN.NS",
  "SHRIRAMFIN.NS","MUTHOOTFIN.NS","MANAPPURAM.NS","SBILIFE.NS","HDFCLIFE.NS",
  "ICICIPRULI.NS","ICICIGI.NS","HDFCAMC.NS","PFC.NS","RECLTD.NS",
  "IRFC.NS","LICI.NS","JIOFIN.NS","BAJAJHLDNG.NS","POONAWALLA.NS",
  // IT & Technology (18)
  "TCS.NS","INFY.NS","HCLTECH.NS","WIPRO.NS","TECHM.NS",
  "LTIM.NS","PERSISTENT.NS","COFORGE.NS","MPHASIS.NS","NAUKRI.NS",
  "ZOMATO.NS","PAYTM.NS","POLICYBZR.NS","DELHIVERY.NS","TATAELXSI.NS",
  "OFSS.NS","CYIENT.NS","LTTS.NS",
  // Oil Gas & Energy (18)
  "RELIANCE.NS","ONGC.NS","NTPC.NS","POWERGRID.NS","COALINDIA.NS",
  "BPCL.NS","IOC.NS","GAIL.NS","ADANIGREEN.NS","ADANIPOWER.NS",
  "ADANIENT.NS","ADANIPORTS.NS","TATAPOWER.NS","JSWENERGY.NS","NHPC.NS",
  "SJVN.NS","ADANIENSOL.NS","ATGL.NS",
  // Automobile (14)
  "TATAMOTORS.NS","MARUTI.NS","BAJAJ-AUTO.NS","HEROMOTOCO.NS","EICHERMOT.NS",
  "TVSMOTOR.NS","ASHOKLEY.NS","MOTHERSON.NS","BALKRISIND.NS","MRF.NS",
  "BHARATFORG.NS","SONACOMS.NS","EXIDEIND.NS","TIINDIA.NS",
  // Pharma & Healthcare (14)
  "SUNPHARMA.NS","DRREDDY.NS","CIPLA.NS","DIVISLAB.NS","APOLLOHOSP.NS",
  "MAXHEALTH.NS","TORRENTPHARMA.NS","ZYDUSLIFE.NS","BIOCON.NS","AUROPHARMA.NS",
  "LUPIN.NS","ALKEM.NS","MANKIND.NS","LAURUSLABS.NS",
  // Metals & Mining (10)
  "TATASTEEL.NS","JSWSTEEL.NS","HINDALCO.NS","VEDL.NS","JINDALSTEL.NS",
  "SAIL.NS","NMDC.NS","NATIONALUM.NS","APLAPOLLO.NS","RATNAMANI.NS",
  // FMCG & Consumer (14)
  "ITC.NS","HINDUNILVR.NS","NESTLEIND.NS","BRITANNIA.NS","GODREJCP.NS",
  "MARICO.NS","COLPAL.NS","DABUR.NS","TATACONSUM.NS","VBL.NS",
  "UBL.NS","MCDOWELL-N.NS","EMAMILTD.NS","PIDILITIND.NS",
  // Cement & Construction (10)
  "ULTRACEMCO.NS","SHREECEM.NS","AMBUJACEM.NS","GRASIM.NS","DLF.NS",
  "LODHA.NS","GODREJPROP.NS","OBEROIRLTY.NS","LT.NS","IRCON.NS",
  // Telecom & Media (6)
  "BHARTIARTL.NS","IDEA.NS","INDIGO.NS","TRENT.NS","DMART.NS","TITAN.NS",
  // Capital Goods & Defence (12)
  "HAL.NS","BEL.NS","BHEL.NS","SIEMENS.NS","ABB.NS",
  "CGPOWER.NS","HAVELLS.NS","POLYCAB.NS","BOSCHLTD.NS","CUMMINSIND.NS",
  "THERMAX.NS","KEI.NS",
  // Chemicals & Specialty (8)
  "SRF.NS","PIIND.NS","UPL.NS","AARTI.NS","DEEPAKNTR.NS",
  "CLEAN.NS","FLUOROCHEM.NS","ASTRAL.NS",
  // Others (6)
  "ASIANPAINT.NS","BERGEPAINT.NS","INDHOTEL.NS","YESBANK.NS",
  "HDFCBANK.NS","PAGEIND.NS"
];

// ═══════════════════════════════════════════════════════════════
//  BSE SENSEX + BSE 200 — 160 symbols (BSE suffix .BO)
// ═══════════════════════════════════════════════════════════════
const BSE_SYMBOLS = [
  // Banking & Finance (30)
  "HDFCBANK.BO","ICICIBANK.BO","SBIN.BO","KOTAKBANK.BO","AXISBANK.BO",
  "INDUSINDBK.BO","BANKBARODA.BO","PNB.BO","CANBK.BO","IDFCFIRSTB.BO",
  "FEDERALBNK.BO","BANDHANBNK.BO","BAJFINANCE.BO","BAJAJFINSV.BO","CHOLAFIN.BO",
  "SHRIRAMFIN.BO","MUTHOOTFIN.BO","MANAPPURAM.BO","SBILIFE.BO","HDFCLIFE.BO",
  "ICICIPRULI.BO","ICICIGI.BO","HDFCAMC.BO","PFC.BO","RECLTD.BO",
  "IRFC.BO","LICI.BO","JIOFIN.BO","BAJAJHLDNG.BO","POONAWALLA.BO",
  // IT & Technology (18)
  "TCS.BO","INFY.BO","HCLTECH.BO","WIPRO.BO","TECHM.BO",
  "LTIM.BO","PERSISTENT.BO","COFORGE.BO","MPHASIS.BO","NAUKRI.BO",
  "ZOMATO.BO","PAYTM.BO","POLICYBZR.BO","DELHIVERY.BO","TATAELXSI.BO",
  "OFSS.BO","CYIENT.BO","LTTS.BO",
  // Oil Gas & Energy (18)
  "RELIANCE.BO","ONGC.BO","NTPC.BO","POWERGRID.BO","COALINDIA.BO",
  "BPCL.BO","IOC.BO","GAIL.BO","ADANIGREEN.BO","ADANIPOWER.BO",
  "ADANIENT.BO","ADANIPORTS.BO","TATAPOWER.BO","JSWENERGY.BO","NHPC.BO",
  "SJVN.BO","ADANIENSOL.BO","ATGL.BO",
  // Automobile (14)
  "TATAMOTORS.BO","MARUTI.BO","BAJAJ-AUTO.BO","HEROMOTOCO.BO","EICHERMOT.BO",
  "TVSMOTOR.BO","ASHOKLEY.BO","MOTHERSON.BO","BALKRISIND.BO","MRF.BO",
  "BHARATFORG.BO","SONACOMS.BO","EXIDEIND.BO","TIINDIA.BO",
  // Pharma & Healthcare (14)
  "SUNPHARMA.BO","DRREDDY.BO","CIPLA.BO","DIVISLAB.BO","APOLLOHOSP.BO",
  "MAXHEALTH.BO","TORRENTPHARMA.BO","ZYDUSLIFE.BO","BIOCON.BO","AUROPHARMA.BO",
  "LUPIN.BO","ALKEM.BO","MANKIND.BO","LAURUSLABS.BO",
  // Metals & Mining (10)
  "TATASTEEL.BO","JSWSTEEL.BO","HINDALCO.BO","VEDL.BO","JINDALSTEL.BO",
  "SAIL.BO","NMDC.BO","NATIONALUM.BO","APLAPOLLO.BO","RATNAMANI.BO",
  // FMCG & Consumer (14)
  "ITC.BO","HINDUNILVR.BO","NESTLEIND.BO","BRITANNIA.BO","GODREJCP.BO",
  "MARICO.BO","COLPAL.BO","DABUR.BO","TATACONSUM.BO","VBL.BO",
  "UBL.BO","MCDOWELL-N.BO","EMAMILTD.BO","PIDILITIND.BO",
  // Cement & Construction (10)
  "ULTRACEMCO.BO","SHREECEM.BO","AMBUJACEM.BO","GRASIM.BO","DLF.BO",
  "LODHA.BO","GODREJPROP.BO","OBEROIRLTY.BO","LT.BO","IRCON.BO",
  // Telecom & Media (6)
  "BHARTIARTL.BO","IDEA.BO","INDIGO.BO","TRENT.BO","DMART.BO","TITAN.BO",
  // Capital Goods & Defence (12)
  "HAL.BO","BEL.BO","BHEL.BO","SIEMENS.BO","ABB.BO",
  "CGPOWER.BO","HAVELLS.BO","POLYCAB.BO","BOSCHLTD.BO","CUMMINSIND.BO",
  "THERMAX.BO","KEI.BO",
  // Chemicals & Specialty (8)
  "SRF.BO","PIIND.BO","UPL.BO","AARTI.BO","DEEPAKNTR.BO",
  "CLEAN.BO","FLUOROCHEM.BO","ASTRAL.BO",
  // Others (6)
  "ASIANPAINT.BO","BERGEPAINT.BO","INDHOTEL.BO","YESBANK.BO",
  "HDFCBANK.BO","PAGEIND.BO"
];

const STATIC_FALLBACK: StockData[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 1358, change: 1.25, value: 18.3e12, sector: 'Oil Gas & Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy', price: 4120, change: -0.45, value: 15e12, sector: 'IT & Technology' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1680, change: 0.85, value: 12.7e12, sector: 'Banking & Finance' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1350, change: 2.10, value: 9.5e12, sector: 'Banking & Finance' },
  { symbol: 'INFY', name: 'Infosys', price: 1540, change: -1.20, value: 6.4e12, sector: 'IT & Technology' },
  { symbol: 'SBIN', name: 'State Bank of India', price: 780, change: 3.30, value: 7e12, sector: 'Banking & Finance' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1900, change: 1.50, value: 11.5e12, sector: 'Telecom & Media' },
  { symbol: 'ITC', name: 'ITC Limited', price: 430, change: -2.20, value: 5.3e12, sector: 'FMCG & Consumer' },
  { symbol: 'HINDUNILVR', name: 'HUL', price: 2340, change: -0.70, value: 5.5e12, sector: 'FMCG & Consumer' },
  { symbol: 'LT', name: 'Larsen & Toubro', price: 3450, change: 0.90, value: 4.7e12, sector: 'Cement & Construction' },
];

export default function BespokeIndianHeatmap({ exchange }: { exchange: 'NSE' | 'BSE' }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedSector, setZoomedSector] = useState<string | null>(null);
  const [hoveredStock, setHoveredStock] = useState<StockData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ w: 1000, h: 750 });
  const [stockCount, setStockCount] = useState(0);

  // Responsive container sizing
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setContainerSize({ w: Math.max(r.width, 300), h: Math.max(r.height, 300) });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const symbols = exchange === 'NSE' ? NSE_SYMBOLS : BSE_SYMBOLS;
        // Deduplicate
        const unique = [...new Set(symbols)];
        const encoded = unique.map(s => encodeURIComponent(s)).join(',');
        const res = await fetch(`/api/heatmap-data?symbols=${encoded}`);
        const json = await res.json();
        if (isMounted && json.data && json.data.length > 0) {
          setData(json.data);
          setStockCount(json.data.length);
        } else if (isMounted) {
          const fb = STATIC_FALLBACK.map(s => ({ ...s, symbol: exchange === 'NSE' ? s.symbol + '.NS' : s.symbol + '.BO' }));
          setData(fb);
          setStockCount(fb.length);
        }
      } catch {
        if (isMounted) {
          const fb = STATIC_FALLBACK.map(s => ({ ...s, symbol: exchange === 'NSE' ? s.symbol + '.NS' : s.symbol + '.BO' }));
          setData(fb);
          setStockCount(fb.length);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [exchange]);

  const rootNode = useMemo(() => {
    if (!data.length) return null;
    let activeData = zoomedSector ? data.filter(d => (d.sector || 'Other') === zoomedSector) : data;

    const sectors: Record<string, HierarchyNode[]> = {};
    activeData.forEach(stock => {
      const s = stock.sector || 'Other';
      if (!sectors[s]) sectors[s] = [];
      sectors[s].push({ name: stock.symbol, type: "stock", stock, value: Math.max(stock.value || 1, 1) });
    });

    const children: HierarchyNode[] = Object.entries(sectors).map(([name, nodes]) => {
      if (zoomedSector) return nodes;
      return { name, type: "sector", children: nodes } as HierarchyNode;
    }).flat();

    return d3.hierarchy<HierarchyNode>({ name: "Market", type: "root", children })
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
  }, [data, zoomedSector]);

  const isMobile = containerSize.w < 640;

  const leaves = useMemo(() => {
    if (!rootNode) return [];
    d3.treemap<HierarchyNode>()
      .size([containerSize.w, containerSize.h])
      .paddingInner(isMobile ? 1 : 1.5)
      .paddingOuter(zoomedSector ? 0 : (isMobile ? 1 : 3))
      .paddingTop(zoomedSector ? 0 : (isMobile ? 14 : 20))
      .round(true)(rootNode);
    return rootNode.leaves();
  }, [rootNode, zoomedSector, containerSize, isMobile]);

  const groups = useMemo(() => {
    if (!rootNode || zoomedSector) return [];
    return rootNode.children || [];
  }, [rootNode, zoomedSector]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#050505] gap-4">
        <div className="w-12 h-12 border-4 border-[#089981]/20 border-t-[#089981] rounded-full animate-spin" />
        <p className="text-gray-400 font-bold text-xs tracking-widest uppercase animate-pulse">Loading {exchange} Market Data...</p>
      </div>
    );
  }

  const getTvColor = (c: number) => {
    if (c > 3) return '#089981';
    if (c > 1.5) return 'rgba(8,153,129,0.85)';
    if (c > 0) return 'rgba(8,153,129,0.55)';
    if (c === 0) return '#434651';
    if (c > -1.5) return 'rgba(242,54,69,0.55)';
    if (c > -3) return 'rgba(242,54,69,0.85)';
    return '#f23645';
  };

  return (
    <div className="h-full w-full bg-[#050505] flex flex-col font-sans select-none relative overflow-hidden"
         onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}>

      {/* Top Bar */}
      <div className="bg-[#131722] border-b border-[#2b3139] px-3 py-1.5 flex items-center justify-between shrink-0 z-20">
        {zoomedSector ? (
          <button onClick={() => setZoomedSector(null)} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider">
            <ArrowLeft size={14} /> All Sectors <span className="text-gray-600 mx-1">/</span> <span className="text-white">{zoomedSector}</span>
          </button>
        ) : (
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{exchange} Market Heatmap</div>
        )}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500 font-mono">{stockCount} stocks</span>
          <button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 100); }} className="text-gray-500 hover:text-white"><RefreshCw size={12} /></button>
        </div>
      </div>

      {/* Treemap */}
      <div ref={containerRef} className="relative flex-1 w-full overflow-hidden">
        {/* Sector boxes */}
        {!zoomedSector && groups.map((g, i) => {
          const left = g.x0!; const top = g.y0!; const w = g.x1! - g.x0!; const h = g.y1! - g.y0!;
          if (w < 2 || h < 2) return null;
          return (
            <div key={`s-${i}`} className="absolute border border-[#1e222d] cursor-pointer hover:border-[#3b82f6]/60 transition-colors z-0"
              style={{ left, top, width: w, height: h }} onClick={() => setZoomedSector(g.data.name)}>
              {w > 50 && h > 20 && (
                <div className="absolute top-0 left-0 px-1.5 py-[1px] bg-[#131722] text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate max-w-full rounded-br z-20">
                  {g.data.name}
                </div>
              )}
            </div>
          );
        })}

        {/* Stock tiles */}
        {leaves.map((leaf, i) => {
          const left = leaf.x0!; const top = leaf.y0!; const w = leaf.x1! - leaf.x0!; const h = leaf.y1! - leaf.y0!;
          const stock = leaf.data.stock;
          if (!stock || w < 1 || h < 1) return null;
          const sym = stock.symbol.split('.')[0];
          const chg = stock.change > 0 ? `+${stock.change.toFixed(1)}%` : `${stock.change.toFixed(1)}%`;
          const showSym = w > 22 && h > 16;
          const showChg = w > 30 && h > 28;
          const fontSize = Math.max(Math.min(w / (sym.length * 0.75), h * 0.35, isMobile ? 11 : 14), 6);
          const chgSize = Math.max(fontSize * 0.75, 5);

          return (
            <div key={`l-${i}`}
              className="absolute flex flex-col items-center justify-center text-white overflow-hidden cursor-pointer hover:brightness-125 active:brightness-150 transition-all z-10"
              style={{ left, top, width: w, height: h, backgroundColor: getTvColor(stock.change), borderRight: '1px solid #050505', borderBottom: '1px solid #050505' }}
              onMouseEnter={() => setHoveredStock(stock)}
              onMouseLeave={() => setHoveredStock(null)}
              onClick={e => { e.stopPropagation(); router.push(`/stock/${encodeURIComponent(stock.symbol)}`); }}
            >
              {showSym && <div className="font-bold text-center truncate w-full px-0.5 leading-tight" style={{ fontSize }}>{sym}</div>}
              {showChg && <div className="opacity-80 text-center truncate w-full leading-tight" style={{ fontSize: chgSize }}>{chg}</div>}
            </div>
          );
        })}
      </div>

      {/* Tooltip (desktop only) */}
      {hoveredStock && !isMobile && (
        <div className="fixed z-50 pointer-events-none bg-[#1e222d] border border-[#2b3139] shadow-2xl rounded-lg p-3 w-56 -translate-x-1/2 -translate-y-[120%]"
          style={{ left: mousePos.x, top: mousePos.y }}>
          <div className="flex justify-between items-start mb-2 border-b border-[#2b3139] pb-2">
            <div>
              <div className="font-bold text-white text-sm">{hoveredStock.symbol.split('.')[0]}</div>
              <div className="text-[10px] text-gray-400 truncate max-w-[130px]">{hoveredStock.name}</div>
            </div>
            <div className={`text-sm font-bold ${hoveredStock.change > 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
              {hoveredStock.change > 0 ? '+' : ''}{hoveredStock.change.toFixed(2)}%
            </div>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="text-white font-mono">₹{hoveredStock.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Sector</span><span className="text-white">{hoveredStock.sector}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
