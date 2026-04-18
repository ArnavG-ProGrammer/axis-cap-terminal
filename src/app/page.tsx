"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Newspaper, PieChart, ShieldAlert, Sparkles, AlertCircle, Plus, X, Bell, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/components/CurrencyContext";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

const TickerTape = dynamic(
  () => import("react-ts-tradingview-widgets").then((mod) => mod.TickerTape),
  { ssr: false }
);
const TimelineWidget = dynamic(
  () => import("react-ts-tradingview-widgets").then((mod) => mod.Timeline),
  { ssr: false }
);

export default function Home() {
  const { currencySymbol, getConvertedPrice } = useCurrency();
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTicker, setAlertTicker] = useState("AAPL");
  const [alertPrice, setAlertPrice] = useState("200");
  const [alertsList, setAlertsList] = useState([
    { ticker: "TSLA", desc: "TSLA dropped below $180.00 target point.", color: "bg-[#34d74a]" },
    { ticker: "NVDA", desc: "NVDA Q3 Earnings today at 4:00 PM EST.", color: "bg-blue-500" }
  ]);
  
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const handleCurrencySwapped = () => { window.location.reload(); };
    window.addEventListener("currencyChange", handleCurrencySwapped);
    return () => window.removeEventListener("currencyChange", handleCurrencySwapped);
  }, []);

  useEffect(() => {
    const fetchDashboardState = async () => {
      // Fetch Supabase Data
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
         setSessionUser(session.user.id);
         const { data, error } = await supabase
           .from('user_portfolios')
           .select('*')
           .eq('user_id', session.user.id);
           
         if (data && !error) {
           setPortfolioData(data);
           if (data.length === 0) {
              setShowOnboarding(true);
           }
         }
      }
    };
    fetchDashboardState();
  }, [getConvertedPrice]);

  const totalValue = portfolioData.reduce((acc, curr) => acc + (curr.qty * getConvertedPrice(curr.price, curr.symbol)), 0);

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertsList([{ ticker: alertTicker, desc: `Custom alert set for ${currencySymbol}${alertPrice}`, color: "bg-[#d76034]" }, ...alertsList]);
    setAlertOpen(false);
  };

  return (
    <>
      <Head>
        <title>AXIS CAP | Institutional Dashboard</title>
      </Head>

      {/* INITIAL ONBOARDING WIZARD */}
      {showOnboarding && (
         <div className="fixed inset-0 bg-[#000]/95 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
            <div className="bg-[#0a0a0a] border border-[#34d74a]/30 rounded-2xl w-full max-w-3xl overflow-hidden shadow-[0_0_80px_rgba(52,215,74,0.15)] relative animate-fade-in">
               <div className="p-8 md:p-10">
                  <div className="w-12 h-12 bg-[#34d74a]/20 rounded-full flex items-center justify-center mb-6">
                     <Sparkles className="text-[#34d74a]" size={24} />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-3 uppercase tracking-wide">Terminal Initialized</h1>
                  <p className="text-gray-400 mb-8 max-w-xl leading-relaxed text-sm md:text-base">Your portfolio is empty. Use the <strong>Surf Market</strong> or <strong>Explorer</strong> to find assets, then add them to your portfolio from any stock detail page using the <strong>+ Add Logic</strong> button.</p>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                      {[
                        { s: 'AAPL', n: 'Apple Inc', href: '/stock/AAPL' }, 
                        { s: 'RELIANCE.NS', n: 'Reliance Industries', href: '/stock/RELIANCE.NS' }, 
                        { s: 'BTC-USD', n: 'Bitcoin', href: '/stock/BTC-USD' }, 
                        { s: 'NVDA', n: 'NVIDIA', href: '/stock/NVDA' }, 
                        { s: 'TCS.NS', n: 'TCS India', href: '/stock/TCS.NS' }, 
                        { s: 'GC=F', n: 'Gold Futures', href: '/stock/GC%3DF' }
                      ].map(asset => (
                         <Link key={asset.s} href={asset.href} onClick={() => setShowOnboarding(false)} className="bg-[#111] border border-[#262626] rounded-xl p-4 flex flex-col hover:border-[#34d74a] transition-all group cursor-pointer">
                            <span className="font-bold text-white group-hover:text-[#34d74a] transition-colors">{asset.s}</span>
                            <span className="text-xs text-gray-500 mt-1 uppercase truncate">{asset.n}</span>
                            <span className="text-[10px] text-gray-600 mt-2 font-medium">Click to view & add →</span>
                         </Link>
                      ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                     <Link href="/explorer" onClick={() => setShowOnboarding(false)} className="w-full sm:flex-1 bg-[#34d74a] text-black font-black uppercase py-4 rounded-xl hover:bg-[#2bc43f] transition-all shadow-[0_0_20px_rgba(52,215,74,0.3)] flex justify-center items-center gap-2 text-center">
                        EXPLORE MARKET →
                     </Link>
                     <button onClick={() => setShowOnboarding(false)} className="w-full sm:w-auto px-8 py-4 bg-[#111] text-gray-400 font-bold uppercase rounded-xl hover:bg-[#1a1a1a] hover:text-white transition-all border border-[#262626]">Proceed Manually</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* ALERT MODAL */}
      {alertOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 w-full max-w-md shadow-2xl relative">
             <button onClick={() => setAlertOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
             <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2"><Bell size={20} className="text-[#34d74a]"/> Create Market Alert</h2>
             <form onSubmit={handleCreateAlert} className="space-y-4">
               <div>
                 <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Ticker Symbol</label>
                 <input required value={alertTicker} onChange={(e) => setAlertTicker(e.target.value.toUpperCase())} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-[#34d74a]" placeholder="Ex: HDFC"/>
               </div>
               <div>
                 <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Target Price ({currencySymbol})</label>
                 <input required type="number" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-[#34d74a]" placeholder="Ex: 1500"/>
               </div>
               <button type="submit" className="w-full bg-[#34d74a] text-black font-bold rounded py-3 mt-4 hover:bg-[#2bc43f] transition-colors">Set Active Alert</button>
             </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* LIVE TICKER TAPE */}
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden shadow-lg mb-6">
          <TickerTape colorTheme="dark" displayMode="compact" />
        </div>

        {/* MARKET OVERVIEW */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight">Market Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: "S&P 500", value: 5130.95, change: "+1.2%", isUp: true },
              { title: "NASDAQ", value: 16274.94, change: "+1.5%", isUp: true },
              { title: "NIFTY 50", value: 22336.40, change: "-0.4%", isUp: false },
              { title: "VIX", value: 13.11, change: "-2.1%", isUp: false, sub: "Low Volatility" },
            ].map((idx, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5 hover:bg-[#141414] transition-colors">
                <p className="text-gray-400 text-sm font-medium">{idx.title}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-white">{idx.value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className={`mt-2 flex items-center gap-1 text-sm ${idx.isUp ? "text-[#34d74a]" : "text-[#d73434]"}`}>
                  {idx.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{idx.change} {idx.sub && <span className="text-gray-500 ml-2">({idx.sub})</span>}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PORTFOLIO TRACKER (Left Side - 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-400">Total Portfolio Value</h2>
                  <div className="text-4xl font-black mt-2 tracking-tight text-white">{currencySymbol}{totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  <div className="mt-2 text-[#34d74a] flex items-center gap-1 font-medium">
                    <TrendingUp size={18} /> +{currencySymbol}{(totalValue * 0.0115).toLocaleString('en-US', {minimumFractionDigits: 2})} (1.15%) <span className="text-gray-500 text-sm ml-2">Today</span>
                  </div>
                </div>
                <button className="bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition">
                  Deposit
                </button>
              </div>

              {/* Top Holdings Dynamic */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2"><PieChart size={16}/> Top Holdings</h3>
                <div className="space-y-3 mt-4">
                  {portfolioData.length > 0 ? portfolioData.slice(0,4).map((stock, i) => {
                    const value = stock.qty * stock.price;
                    return (
                    <Link href={`/stock/${stock.symbol}`} key={i}>
                      <div className="flex items-center justify-between p-3 bg-[#111111] rounded-lg border border-[#262626] hover:border-gray-500 cursor-pointer transition mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center font-bold text-sm text-white">
                            {stock.symbol.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{stock.symbol}</div>
                            <div className="text-xs text-gray-400">{stock.qty} units</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white">{currencySymbol}{getConvertedPrice(stock.price, stock.symbol).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                          <div className={`text-xs flex items-center justify-end text-[#34d74a]`}>
                            +0.05%
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <div className="font-medium text-white">{currencySymbol}{(stock.qty * getConvertedPrice(stock.price, stock.symbol)).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                          <div className="text-xs text-gray-400">Total Value</div>
                        </div>
                      </div>
                    </Link>
                  )}) : (
                    <div className="text-gray-500 border border-[#262626] p-4 rounded text-sm text-center">No assets found in Supabase Ledger. Please import CSV or add holding in Portfolio array.</div>
                  )}
                </div>
              </div>
            </section>
            
            {/* AI Insights & Risk Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5 border-l-4 border-l-[#d76034]">
                <h3 className="text-sm font-semibold text-[#d76034] mb-3 flex items-center gap-2">
                  <Sparkles size={16}/> Dynamic AI Insights
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {portfolioData.length > 0 
                    ? `Your exposure contains ${portfolioData.length} unique assets. I have isolated ${portfolioData[0]?.type || 'Equities'} as your heaviest sector concentration based on ledger volume.` 
                    : `No assets detected. Please integrate a CSV or broker connection to generate AI scoring heuristics.`}
                  <br/><br/>
                  <span className="font-semibold text-white">
                     {portfolioData.length > 0 
                        ? `${portfolioData[0]?.symbol} is showing reduced volatility inside the consolidation range.` 
                        : 'Awaiting structural pipeline injection...'}
                  </span>
                </p>
              </div>

              <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                  <ShieldAlert size={16}/> Risk Analysis
                </h3>
                <div className="space-y-4">
                  {(() => {
                     let volType = portfolioData.length === 0 ? "N/A" : portfolioData.length > 5 ? "Low" : "Medium";
                     let volColor = portfolioData.length > 5 ? "bg-[#34d74a]" : "bg-yellow-400";
                     let divScore = portfolioData.length === 0 ? 0 : Math.min(100, portfolioData.length * 16);
                     let divText = divScore > 75 ? "High" : divScore > 40 ? "Medium" : "Low";
                     let divColor = divScore > 75 ? "bg-[#34d74a]" : divScore > 40 ? "bg-yellow-400" : "bg-red-400";
                     return (
                        <>
                           <div>
                           <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Portfolio Volatility</span>
                              <span className="text-white font-medium">{volType}</span>
                           </div>
                           <div className="w-full bg-[#1a1a1a] rounded-full h-1.5"><div className={`${volColor} h-1.5 rounded-full`} style={{width: portfolioData.length > 5 ? '30%' : '60%'}}></div></div>
                           </div>
                           <div>
                           <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Diversification Score</span>
                              <span className="text-white font-medium">{divText} ({divScore}/100)</span>
                           </div>
                           <div className="w-full bg-[#1a1a1a] rounded-full h-1.5"><div className={`${divColor} h-1.5 rounded-full transition-all`} style={{width: `${divScore}%`}}></div></div>
                           </div>
                        </>
                     )
                  })()}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR (News & ALerts) */}
          <div className="space-y-6">
            
            {/* Alerts */}
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                    <AlertCircle size={16}/> Active Alerts
                  </h3>
                  <button onClick={() => setAlertOpen(true)} className="text-[#34d74a] text-xs font-bold flex items-center gap-1 hover:text-white transition-colors">
                    <Plus size={14}/> Add New
                  </button>
                </div>
                <div className="space-y-3">
                  {alertsList.map((al, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-[#111] rounded border border-[#262626]">
                      <div className={`w-2 h-2 rounded-full ${al.color} mt-1.5`}></div>
                      <div>
                        <p className="text-sm font-medium text-white">{al.ticker} Alert Hit</p>
                        <p className="text-xs text-gray-400 mt-1">{al.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
            </div>

            {/* Financial News Feed — Powered by TradingView (Always Live, No API Key Needed) */}
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden h-[500px]">
              <div className="px-5 py-3 bg-[#111] border-b border-[#262626] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#34d74a] animate-pulse"></div>
                <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                  <Newspaper size={16}/> Live Terminal Feed
                </h3>
              </div>
              <div className="h-[calc(100%-44px)]">
                <TimelineWidget colorTheme="dark" feedMode="market" market="stock" displayMode="regular" height="100%" width="100%" />
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
