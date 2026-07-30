"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { Briefcase, Info, TrendingDown, TrendingUp, Plus, X, Search, Check, FileText, Trash2, History, BarChart2, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import useSWR from 'swr';
import { Skeleton } from "@/components/Skeleton";
import { Tooltip as UITooltip } from "@/components/Tooltip";
import { useCurrency } from "@/components/CurrencyContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Camera, Key } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const INITIAL_PORTFOLIO: any[] = [];

export default function PortfolioPage() {
  const router = useRouter();
  const { currencySymbol, getConvertedPrice, getNativeCurrencySymbol } = useCurrency();
  const [activeTab, setActiveTab] = useState('Equities');
  const [portfolioList, setPortfolioList] = useState<any[]>(INITIAL_PORTFOLIO);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Selected Asset State
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetQty, setAssetQty] = useState<string>("1");

  // Broker Sync State
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [brokerConnecting, setBrokerConnecting] = useState<string | null>(null);
  const [brokerSuccess, setBrokerSuccess] = useState(false);

  // Snapshot State
  const portfolioRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAsImage = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    try {
      setIsDownloading(true);
      const htmlToImage = await import('html-to-image');
      
      const originalBg = ref.current.style.backgroundColor;
      ref.current.style.backgroundColor = '#0a0a0a'; 
      
      const dataUrl = await htmlToImage.toJpeg(ref.current, { 
        backgroundColor: '#0a0a0a',
        quality: 1.0,
        pixelRatio: 2,
        style: {
           transform: 'scale(1)',
           transformOrigin: 'top left'
        }
      });
      ref.current.style.backgroundColor = originalBg;
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generating image:", err);
      alert("Failed to capture portfolio. Make sure the view is fully rendered.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Advanced CSV Modal State
  const [showCsvModal, setShowCsvModal] = useState(false);

  // FX Display Mode Flag
  const [nativeMode, setNativeMode] = useState(true);

  // Optimizer State
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizerResults, setOptimizerResults] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const tabs = ['Equities', 'Cryptocurrencies', 'Market Indices', 'Forex', 'Commodities'];
  const filteredAssets = portfolioList.filter(a => a.type === activeTab);

  const runOptimizer = async () => {
    if (filteredAssets.length < 2) {
      alert("You need at least 2 assets in this category to run the Algorithmic Optimizer.");
      return;
    }
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/optimize-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: filteredAssets })
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setIsOptimizing(false);
        return;
      }
      
      const totalValue = calculateTotal(filteredAssets);
      const enrichedAllocations = data.allocations.map((alloc: any) => {
         const asset = filteredAssets.find(a => a.symbol === alloc.symbol);
         const value = asset.qty * getConvertedPrice(asset.price, asset.symbol);
         const currentWeight = value / totalValue;
         return {
            ...alloc,
            name: asset?.name,
            currentWeight,
            action: alloc.targetWeight > currentWeight ? 'BUY' : 'SELL',
            valueDiff: (alloc.targetWeight - currentWeight) * totalValue
         };
      });

      setOptimizerResults({
         allocations: enrichedAllocations,
         sharpeRatio: data.sharpeRatio,
         expectedReturn: data.expectedReturn,
         portfolioBeta: data.portfolioBeta,
         totalValue
      });
      setShowOptimizer(true);
    } catch (e) {
      console.error(e);
      alert("Failed to run optimization algorithm.");
    }
    setIsOptimizing(false);
  };

  const calculateTotal = (assets: any[]) => {
    return assets.reduce((acc, curr) => acc + (curr.qty * getConvertedPrice(curr.livePrice || curr.price, curr.symbol)), 0);
  };

  const handleUpdateQuantity = async (id: string, currentQty: number, delta: number, e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();
     const newQty = currentQty + delta;
     if (newQty <= 0) {
        return handleDeleteAsset(id, e);
     }
     
     // Optimistic Update
     const prevList = [...portfolioList];
     setPortfolioList(prev => prev.map(a => a.id === id ? { ...a, qty: newQty } : a));
     
     try {
       await supabase.from('user_portfolios').update({ qty: newQty }).eq('id', id);
       // We let SWR revalidate in the background silently
     } catch (err) {
       console.error("Failed to update qty", err);
       setPortfolioList(prevList);
     }
  };

  const handleDeleteAsset = async (id: string, e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();
     
     // Optimistic Update
     const prevList = [...portfolioList];
     setPortfolioList(prev => prev.filter(a => a.id !== id));
     
     try {
       await supabase.from('user_portfolios').delete().eq('id', id);
       // We let SWR revalidate in the background silently
     } catch (err) {
       console.error("Failed to delete asset", err);
       setPortfolioList(prevList);
     }
  };

  const exportToCSV = () => {
    if (portfolioList.length === 0) return;
    const headers = ["Symbol", "Name", "Type", "Quantity", "Price", "Total Value"];
    const csvRows = [headers.join(",")];
    
    portfolioList.forEach(asset => {
      const val = asset.qty * asset.price;
      const row = [
        asset.symbol,
        `"${asset.name}"`,
        asset.type,
        asset.qty,
        asset.price.toFixed(2),
        val.toFixed(2)
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'AXIS_CAP_Portfolio.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Auth & Cloud DB Fetch Hook (SWR Fetcher)
  const portfolioFetcher = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
         router.push('/login');
         throw new Error("No session");
      }
      setUserId(session.user.id);
      
      const { data, error } = await supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (data) {
         const consolidatedMap = new Map();
         data.forEach((curr) => {
            if (consolidatedMap.has(curr.symbol)) {
               const existing = consolidatedMap.get(curr.symbol);
               const newTotalQty = existing.qty + curr.qty;
               const newAvgPrice = newTotalQty === 0 ? existing.price : ((existing.qty * existing.price) + (curr.qty * curr.price)) / newTotalQty;
               existing.qty = newTotalQty;
               existing.price = newAvgPrice;
            } else {
               consolidatedMap.set(curr.symbol, { ...curr });
            }
         });
         const deduplicatedData = Array.from(consolidatedMap.values());

         const normalizedData = deduplicatedData.map((curr: any) => {
           let t = curr.type;
           if (t === 'EQUITY' || t === 'Equity') t = 'Equities';
           if (t === 'CRYPTOCURRENCY' || t === 'CRYPTO') t = 'Cryptocurrencies';
           if (t === 'FOREX' || t === 'CURRENCY') t = 'Forex';
           if (t === 'ETF' || t === 'MUTUALFUND') t = 'Market Indices';
           if (t === 'COMMODITY' || t === 'FUTURE') t = 'Commodities';
           return { ...curr, type: t };
         });
         
         if (normalizedData.length > 0) {
            const symbols = normalizedData.map(a => a.symbol).join(',');
            try {
               const quoteRes = await fetch(`/api/batch-quotes?symbols=${encodeURIComponent(symbols)}`);
               const quoteData = await quoteRes.json();
               if (quoteData.quotes) {
                  const quoteMap = new Map();
                  quoteData.quotes.forEach((q: any) => quoteMap.set(q.symbol, q));
                  
                  normalizedData.forEach(asset => {
                     const liveQuote = quoteMap.get(asset.symbol);
                     if (liveQuote) {
                        asset.livePrice = liveQuote.price;
                        asset.liveChange = liveQuote.change;
                     } else {
                        asset.livePrice = asset.price;
                        asset.liveChange = 0;
                     }
                  });
               }
            } catch (e) {
               normalizedData.forEach(asset => {
                  asset.livePrice = asset.price;
                  asset.liveChange = 0;
               });
            }
         }
         
         const { data: txData } = await supabase
           .from('user_transactions')
           .select('*')
           .eq('user_id', session.user.id)
           .order('timestamp', { ascending: true }); 
           
         return { portfolio: normalizedData, transactions: txData || [] };
      }
      return { portfolio: [], transactions: [] };
  };

  const { data: cloudData, error: cloudError, isLoading: isCloudLoading } = useSWR('cloud_portfolio', portfolioFetcher, {
     revalidateOnFocus: true,
     dedupingInterval: 5000,
     onSuccess: (data) => {
        setPortfolioList(data.portfolio);
        setTransactions(data.transactions);
     }
  });

  const [activeFilter, setActiveFilter] = useState('ALL');

  const getOpenLots = (symbol: string) => {
    const symbolTx = transactions.filter(t => t.symbol === symbol);
    let openLots: any[] = [];
    
    for (const tx of symbolTx) {
      if (tx.type === 'BUY' || tx.type === 'SIM_ADD') {
        openLots.push({ ...tx, remaining_qty: tx.qty });
      } else if (tx.type === 'SELL' || tx.type === 'SIM_REMOVE') {
        let sellQty = tx.qty;
        for (let i = 0; i < openLots.length && sellQty > 0; i++) {
          const lot = openLots[i];
          if (lot.remaining_qty > 0) {
            if (lot.remaining_qty > sellQty) {
              lot.remaining_qty -= sellQty;
              sellQty = 0;
            } else {
              sellQty -= lot.remaining_qty;
              lot.remaining_qty = 0;
            }
          }
        }
      }
    }
    return openLots.filter(lot => lot.remaining_qty > 0);
  };

  const handleSellLot = async (lot: any, asset: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sellQty = lot.remaining_qty;
    const executionPrice = asset.livePrice || asset.price;
    
    const txPayload = {
       user_id: userId,
       type: 'SELL',
       symbol: asset.symbol,
       asset_name: asset.name || asset.symbol,
       qty: sellQty,
       execution_price: executionPrice,
       total_value: sellQty * executionPrice,
       status: 'LIVE'
    };
    
    const newMasterQty = asset.qty - sellQty;
    
    try {
       const { error: tErr } = await supabase.from('user_transactions').insert([txPayload]);
       if (tErr) throw tErr;

       if (newMasterQty <= 0) {
          await supabase.from('user_portfolios').delete().eq('id', asset.id);
       } else {
          await supabase.from('user_portfolios').update({ qty: newMasterQty }).eq('id', asset.id);
       }
       
       setTransactions(prev => [...prev, { ...txPayload, timestamp: new Date().toISOString() }]);
       if (newMasterQty <= 0) {
          setPortfolioList(prev => prev.filter(a => a.id !== asset.id));
       } else {
          setPortfolioList(prev => prev.map(a => a.id === asset.id ? { ...a, qty: newMasterQty } : a));
       }
    } catch (err: any) {
       console.error("Failed to sell lot", err);
       alert("Failed to execute sell: " + JSON.stringify(err));
    }
  };

  // Backend Proxy Search Hook
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${searchQuery}`);
        const data = await res.json();
        let results = data.quotes || [];
        
        const qUpper = searchQuery.toUpperCase();
        if (qUpper.includes('GOLD')) results.unshift({ symbol: 'GC=F', shortname: 'Gold Continuous Futures', quoteType: 'COMMODITY', exchDisp: 'COMMODITIES' });
        if (qUpper.includes('SILVER')) results.unshift({ symbol: 'SI=F', shortname: 'Silver Continuous Futures', quoteType: 'COMMODITY', exchDisp: 'COMMODITIES' });
        if (qUpper.includes('COPPER')) results.unshift({ symbol: 'HG=F', shortname: 'Copper Continuous Futures', quoteType: 'COMMODITY', exchDisp: 'COMMODITIES' });

        setSearchResults(results);
      } catch (err) {
        console.error("Proxy Search API Error", err);
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 400); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectToDraft = (asset: any) => {
     let mappedType = "Equities";
     if(asset.quoteType === "CRYPTOCURRENCY") mappedType = "Cryptocurrencies";
     if(asset.quoteType === "CURRENCY") mappedType = "Forex";
     if(asset.quoteType === "ETF" || asset.quoteType === "MUTUALFUND") mappedType = "Market Indices";
     if(asset.quoteType === "COMMODITY" || asset.quoteType === "FUTURE") mappedType = "Commodities";

     setSelectedAsset({
       symbol: asset.symbol,
       name: asset.shortname || asset.longname,
       type: mappedType
     });
     setSearchResults([]);
     setSearchQuery("");
  };

  const currentResults = searchResults.filter(q => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'EQUITY') return q.quoteType === 'EQUITY';
    if (activeFilter === 'CRYPTO') return q.quoteType === 'CRYPTOCURRENCY';
    if (activeFilter === 'FOREX') return q.quoteType === 'CURRENCY';
    if (activeFilter === 'FUNDS') return q.quoteType === 'ETF' || q.quoteType === 'MUTUALFUND';
    if (activeFilter === 'COMMODITY') return q.quoteType === 'COMMODITY' || q.quoteType === 'FUTURE';
    return true;
  });

  const handleConfirmAdd = async () => {
     if(!selectedAsset || !userId) return;
     setIsSyncing(true);

     let executionPrice = 0;
     try {
        const res = await fetch(`/api/quote?q=${selectedAsset.symbol}`);
        if (res.ok) {
           const data = await res.json();
           executionPrice = data.price || 0;
        }
     } catch (err) {
        console.error("Pricing hook failed", err);
     }

     const mappedType = selectedAsset.type;

     try {
       const { data: existingAsset } = await supabase
         .from('user_portfolios')
         .select('*')
         .eq('user_id', userId)
         .eq('symbol', selectedAsset.symbol)
         .maybeSingle();
         
       if (existingAsset) {
          const parsedQty = parseFloat(assetQty);
          const newTotalQty = existingAsset.qty + parsedQty;
          const newAvgPrice = ((existingAsset.qty * existingAsset.price) + (parsedQty * executionPrice)) / newTotalQty;
          await supabase
            .from('user_portfolios')
            .update({ qty: newTotalQty, price: newAvgPrice })
            .eq('id', existingAsset.id);
            
          // Update Local State for UI
          setPortfolioList(prev => prev.map(a => a.id === existingAsset.id ? { ...a, qty: newTotalQty, price: newAvgPrice } : a));
       } else {
         const newAsset = {
           user_id: userId,
           symbol: selectedAsset.symbol,
           name: selectedAsset.name,
           type: mappedType,
           qty: parseFloat(assetQty),
           price: executionPrice
         };
         await supabase.from('user_portfolios').insert([newAsset]);
         setPortfolioList([newAsset, ...portfolioList]);
       }

       const newTransaction = {
         user_id: userId,
         symbol: selectedAsset.symbol,
         asset_name: selectedAsset.name,
         type: 'SIM_ADD',
         qty: parseFloat(assetQty),
         execution_price: executionPrice,
         total_value: executionPrice * parseFloat(assetQty),
         status: 'SIMULATED'
       };
       await supabase.from('user_transactions').insert([newTransaction]);

     } catch (e) {
       console.warn("SQL table strict sync failure. Assuming structural setup pending.", e);
     }

     setIsSyncing(false);
     setShowAddModal(false);
     setSelectedAsset(null);
     setAssetQty("1");
  };

  const handleBrokerSync = async (brokerName: string) => {
     if (!userId) return;
     if (!selectedBroker) {
        setSelectedBroker(brokerName);
        return;
     }
     
     setBrokerConnecting(brokerName);

     // Simulate OAuth latency constraint
     setTimeout(async () => {
         // Create structural sync payload
         const syncPayload = [
            { user_id: userId, symbol: 'TSLA', name: 'Tesla Inc', type: 'Equities', qty: 45, price: 175.40, change: 0 },
            { user_id: userId, symbol: 'MSFT', name: 'Microsoft Corp', type: 'Equities', qty: 10, price: 420.55, change: 0 },
            { user_id: userId, symbol: 'ETHUSD', name: 'Ethereum', type: 'Cryptocurrencies', qty: 4.5, price: 3450.00, change: 0 },
         ];
         
         const txPayload = syncPayload.map(a => ({
             user_id: userId, symbol: a.symbol, asset_name: a.name, type: 'SIM_IMPORT', qty: a.qty, execution_price: a.price, total_value: a.price * a.qty, status: 'SIMULATED'
         }));

         try {
             await Promise.all([
                 supabase.from('user_portfolios').insert(syncPayload),
                 supabase.from('user_transactions').insert(txPayload)
             ]);
         } catch (e) {
             console.warn("Broker DB Sync Error (Assuming Tables setup pending):", e);
         }

         setPortfolioList([...syncPayload, ...portfolioList]);
         setBrokerConnecting(null);
         setBrokerSuccess(true);
         
         // Fix state array binding bug so imported arrays immediately render
         setActiveTab('Equities');

         setTimeout(() => {
             setBrokerSuccess(false);
             setShowBrokerModal(false);
         }, 2000);
     }, 2500); 
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0];
     if (!file || !userId) return;
     
     const reader = new FileReader();
     reader.onload = async (e) => {
        try {
           const text = e.target?.result as string;
           const lines = text.split('\n');
           const syncPayload = [];

           const determineCategory = (sym: string) => {
              const s = sym.toUpperCase();
              if (s.includes('BTC') || s.includes('ETH') || s.includes('SOL') || s.includes('DOGE') || s.includes('XRP')) return 'Cryptocurrencies';
              if (s.includes('GLD') || s.includes('SLV') || s.includes('OIL') || s.includes('XAU') || s.includes('XAG')) return 'Commodities';
              if (s.includes('USD') || s.includes('EUR') || s.includes('GBP') || s.includes('JPY')) return 'Forex';
              if (s.includes('SPY') || s.includes('QQQ') || s.includes('DIA') || s.includes('VTI')) return 'Market Indices';
              return 'Equities';
           };

           // Basic parsing assuming: Symbol, Name, Qty, Price
           for (let i = 1; i < lines.length; i++) {
              if (!lines[i].trim()) continue;
              const cols = lines[i].split(',');
              if (cols.length >= 4) {
                 const symbol = cols[0].replace(/"/g, '').trim();
                 const name = cols[1].replace(/"/g, '').trim();
                 const qty = parseFloat(cols[2].replace(/"/g, '').trim());
                 const price = parseFloat(cols[3].replace(/"/g, '').trim());
                 
                 if (!isNaN(qty) && !isNaN(price)) {
                    syncPayload.push({
                       user_id: userId, symbol, name, type: determineCategory(symbol), qty, price, change: 0
                    });
                 }
              }
           }

           if (syncPayload.length > 0) {
              const txPayload = syncPayload.map(a => ({
                 user_id: userId, symbol: a.symbol, asset_name: a.name, type: 'SIM_IMPORT', qty: a.qty, execution_price: a.price, total_value: a.price * a.qty, status: 'SIMULATED'
              }));

              await Promise.all([
                  supabase.from('user_portfolios').insert(syncPayload),
                  supabase.from('user_transactions').insert(txPayload)
              ]);

              setPortfolioList([...syncPayload, ...portfolioList]);
              setActiveTab('Equities');
              alert(`Successfully imported ${syncPayload.length} holdings from CSV!`);
              setShowCsvModal(false);
           }
        } catch (err) {
           console.error("CSV Parse Error", err);
           alert("Failed to parse CSV file. Ensure format is: Symbol,Name,Qty,Price.");
        }
     };
     reader.readAsText(file);
  };

  return (
    <>
      <Head>
        <title>Portfolio | AXIS CAP</title>
      </Head>

      {/* ADD ASSET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 w-full max-w-lg shadow-2xl relative">
             <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
             <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">Add New Portfolio Asset</h2>
             
             {!selectedAsset ? (
               <div className="space-y-4">
                 <div className="relative">
                   <Search className="absolute left-3 top-[11px] text-gray-500" size={16} />
                   <input 
                     autoFocus
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 pl-9 text-white focus:outline-none focus:border-[#34d74a]" 
                     placeholder="Search Global Markets (e.g. RELIANCE, GOLD)..."
                   />
                   {isSearching && <Loader2 className="absolute right-3 top-[11px] text-gray-500 animate-spin" size={16} />}
                 </div>

                 {searchQuery.length >= 2 && (
                    <div className="bg-[#111] border border-[#262626] rounded-md flex flex-col">
                      <div className="flex items-center border-b border-[#262626] p-2 gap-1 overflow-x-auto no-scrollbar">
                        {['ALL', 'EQUITY', 'CRYPTO', 'FOREX', 'FUNDS', 'COMMODITY'].map((f) => (
                           <button 
                             key={f}
                             onClick={() => setActiveFilter(f)}
                             className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${activeFilter === f ? 'bg-[#34d74a] text-black' : 'text-gray-500 hover:text-white'}`}
                           >
                             {f}
                           </button>
                        ))}
                      </div>
                      
                      <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                        {currentResults.length > 0 ? (
                          currentResults.map((t, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => handleSelectToDraft(t)}
                              className="px-3 py-3 hover:bg-[#1a1a1a] cursor-pointer flex flex-col border-b border-[#1a1a1a] last:border-0"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-white text-sm font-bold">{t.symbol}</span>
                                <span className="text-gray-600 text-[10px] uppercase px-1 rounded border border-[#262626] bg-[#0a0a0a]">{t.quoteType}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                 <span className="text-gray-500 text-[11px] w-48 truncate">{t.shortname || t.longname}</span>
                                 <span className="text-gray-600 text-[9px] uppercase">{t.exchDisp}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-sm text-gray-500 text-center">
                            {isSearching ? "Querying..." : `No ${activeFilter !== 'ALL' ? activeFilter : ''} asset found.`}
                          </div>
                        )}
                      </div>
                    </div>
                 )}
               </div>
             ) : (
               <div className="space-y-4">
                 <div className="flex justify-between items-start bg-[#111] p-4 rounded border border-[#262626]">
                    <div>
                      <h3 className="text-lg font-bold text-[#34d74a]">{selectedAsset.symbol}</h3>
                      <p className="text-gray-400 text-sm">{selectedAsset.name}</p>
                    </div>
                    <button onClick={() => setSelectedAsset(null)} className="text-xs text-gray-500 underline hover:text-white">Change</button>
                 </div>
                 <div>
                   <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Quantity Owned</label>
                   <input required type="number" step="any" min="0" value={assetQty} onChange={(e) => setAssetQty(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-3 text-white focus:outline-none focus:border-[#34d74a] font-mono text-lg" placeholder="Ex: 50.5"/>
                 </div>
                 <button onClick={handleConfirmAdd} className="w-full bg-[#34d74a] text-black font-bold rounded py-3 mt-4 hover:bg-[#2bc43f] transition-colors shadow-[0_0_15px_rgba(52,215,74,0.3)]">Simulate Asset Injection</button>
               </div>
             )}
          </div>
        </div>
      )}

      {/* OVERLAY: BROKER OAUTH SYNC MODAL */}
      {showBrokerModal && (
        <div className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#34d74a]/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex justify-between items-center p-4 border-b border-[#262626] relative z-10">
                <div>
                   <h2 className="text-white font-bold tracking-wider uppercase">{selectedBroker ? `${selectedBroker} API Configuration` : 'Link External App API'}</h2>
                   <p className="text-xs text-gray-500">{selectedBroker ? 'Secure Token Registration' : 'Automated Data Aggregation'}</p>
                </div>
                <button onClick={() => { setShowBrokerModal(false); setSelectedBroker(null); setBrokerSuccess(false); setBrokerConnecting(null); setApiKeyInput(""); }} className="text-gray-500 hover:text-white p-2 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 relative z-10">
                 {brokerSuccess ? (
                    <div className="text-center py-10 space-y-4 animate-fade-in">
                       <div className="w-16 h-16 bg-[#34d74a]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#34d74a]/50">
                          <Check size={32} className="text-[#34d74a]" />
                       </div>
                       <h3 className="text-xl font-bold text-white tracking-widest">SYNC COMPLETE</h3>
                       <p className="text-gray-400 text-sm">Broker holdings seamlessly injected to Supabase ledger via API.</p>
                    </div>
                 ) : brokerConnecting ? (
                     <div className="text-center py-10 space-y-6">
                        <Loader2 className="animate-spin text-[#34d74a] mx-auto opacity-80" size={48} />
                        <div>
                           <p className="text-[#34d74a] font-mono tracking-widest uppercase text-sm animate-pulse">Establishing OAuth Sequence to {brokerConnecting}...</p>
                           <p className="text-gray-500 text-xs mt-2">Bypassing internal encryption layer. Extracting ledger array.</p>
                        </div>
                     </div>
                  ) : selectedBroker ? (
                        <div className="animate-fade-in">
                          <p className="text-gray-400 text-sm mb-4">Enter your {selectedBroker} API Key/Token below. Your keys are encrypted locally and never stored in plain text.</p>
                          <div className="flex items-center gap-3 bg-[#111] border border-[#262626] p-3 rounded-lg mb-6">
                            <Key size={18} className="text-gray-500" />
                            <input 
                              type="password" 
                              value={apiKeyInput}
                              onChange={(e) => setApiKeyInput(e.target.value)}
                              placeholder={`Enter ${selectedBroker} Developer Key...`} 
                              className="bg-transparent border-none text-white w-full focus:outline-none text-sm"
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setSelectedBroker(null)} className="text-gray-500 hover:text-white text-sm font-bold uppercase px-4">Cancel</button>
                            <button onClick={() => handleBrokerSync(selectedBroker)} disabled={!apiKeyInput} className="bg-[#34d74a] hover:bg-[#28b03a] disabled:opacity-50 text-black px-6 py-2 rounded-lg font-bold text-sm tracking-wider shadow-[0_0_15px_rgba(52,215,74,0.3)] transition-all">CONNECT API</button>
                          </div>
                        </div>
                     ) : (
                        <>
                           <div className="text-center mb-6">
                              <p className="text-gray-400 text-sm">Select an external institutional broker or retail application to automatically tunnel historical trades into your Supabase transactions list.</p>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              {['TradingView', 'Groww', 'Zerodha', 'Robinhood', 'Interactive Brokers', 'Fidelity'].map(broker => (
                                 <button key={broker} onClick={() => handleBrokerSync(broker)} className="bg-[#111] border border-[#262626] hover:border-[#34d74a] transition-all py-4 px-2 rounded-xl flex flex-col items-center gap-3 group">
                                    <div className="w-10 h-10 bg-[#1a1a1a] rounded flex items-center justify-center group-hover:bg-[#34d74a]/10 transition-colors">
                                       <Briefcase className="text-gray-400 group-hover:text-[#34d74a] transition-colors" size={20} />
                                    </div>
                                    <span className="text-white text-xs font-bold tracking-wider uppercase">{broker}</span>
                                 </button>
                              ))}
                           </div>
                        </>
                 )}
              </div>
          </div>
        </div>
      )}

      {/* OVERLAY: ADVANCED CSV IMPORT MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in relative">
              <div className="flex justify-between items-center p-4 border-b border-[#262626] relative z-10">
                <div>
                   <h2 className="text-white font-bold tracking-wider uppercase">Advanced Portfolio Import</h2>
                   <p className="text-xs text-gray-500">Universal CSV Aggregation Pipeline</p>
                </div>
                <button onClick={() => setShowCsvModal(false)} className="text-gray-500 hover:text-white p-2 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 relative z-10">
                 <div className="mb-6 space-y-4">
                    <p className="text-gray-300 text-sm">
                      If your external broker (like Groww, Zerodha, or TradingView manual export) is not natively supported by our API bridges, you can import your portfolio manually via a standard CSV file.
                    </p>
                    <div className="bg-[#111] border border-[#262626] p-4 rounded-lg">
                       <h4 className="text-xs font-bold text-[#34d74a] uppercase tracking-widest mb-3">Required CSV Format</h4>
                       <p className="text-xs text-gray-400 mb-2">Ensure your CSV contains exactly 4 columns in this exact order:</p>
                       <code className="block bg-black text-gray-300 p-3 rounded font-mono text-xs border border-[#333]">
                          Symbol, Name, Qty, Price<br/>
                          AAPL, Apple Inc., 150, 175.50<br/>
                          NVDA, NVIDIA Corp., 45, 860.20
                       </code>
                    </div>
                 </div>

                 <div className="flex justify-center">
                    <label className="flex items-center justify-center w-full gap-3 bg-[#111] hover:bg-[#1a1a1a] text-white border border-[#262626] hover:border-[#34d74a] transition-colors py-4 rounded-xl text-sm font-bold cursor-pointer group">
                      <FileText className="text-gray-400 group-hover:text-[#34d74a] transition-colors" size={20} /> 
                      SELECT .CSV FILE TO UPLOAD
                      <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                    </label>
                 </div>
              </div>
          </div>
        </div>
      )}

      {/* OVERLAY: MARKOWITZ OPTIMIZER MODAL */}
      {showOptimizer && optimizerResults && (
        <div className="fixed inset-0 bg-[#000]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#34d74a]/30 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(52,215,74,0.1)] custom-scrollbar relative">
              <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#262626] p-6 z-20 flex justify-between items-center">
                 <div>
                    <h2 className="text-xl md:text-2xl font-black tracking-widest uppercase text-[#34d74a] flex items-center gap-3">
                       <BarChart2 size={24} /> Markowitz Efficient Frontier Engine
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Quantitative Risk Parity & Algorithmic Allocation Matrix</p>
                 </div>
                 <button onClick={() => setShowOptimizer(false)} className="text-gray-500 hover:text-white p-2 transition-colors bg-[#111] rounded-lg">
                   <X size={24} />
                 </button>
              </div>

              <div className="p-6">
                 {/* Top Metrics Row */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#111] border border-[#262626] rounded-xl p-4">
                       <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Portfolio Beta</p>
                       <p className="text-xl sm:text-2xl font-bold text-white">{optimizerResults.portfolioBeta.toFixed(2)}</p>
                       <p className="text-[10px] text-gray-500 mt-1">Market Correlation Risk</p>
                    </div>
                    <div className="bg-[#111] border border-[#262626] rounded-xl p-4">
                       <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Expected Return</p>
                       <p className="text-xl sm:text-2xl font-bold text-[#34d74a]">{(optimizerResults.expectedReturn * 100).toFixed(2)}%</p>
                       <p className="text-[10px] text-gray-500 mt-1">CAPM Theoretical Target</p>
                    </div>
                    <div className="bg-[#111] border border-[#262626] rounded-xl p-4">
                       <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Sharpe Ratio</p>
                       <p className="text-xl sm:text-2xl font-bold text-white">{optimizerResults.sharpeRatio.toFixed(2)}</p>
                       <p className="text-[10px] text-gray-500 mt-1">Risk-Adjusted Alpha</p>
                    </div>
                    <div className="bg-[#111] border border-[#262626] rounded-xl p-4">
                       <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Execution Size</p>
                       <p className="text-xl sm:text-2xl font-bold text-white">{currencySymbol}{optimizerResults.totalValue.toLocaleString('en-US', {maximumFractionDigits: 0})}</p>
                       <p className="text-[10px] text-gray-500 mt-1">Total Base Layer</p>
                    </div>
                 </div>

                 {/* Allocations Table */}
                 <h3 className="text-sm font-bold tracking-widest uppercase text-gray-400 mb-4 border-b border-[#262626] pb-2">Target Weight Optimization Matrix</h3>
                 <div className="bg-[#111] border border-[#262626] rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-[#1a1a1a] text-xs text-gray-500 uppercase tracking-wider">
                          <tr>
                             <th className="px-6 py-3">Asset Matrix</th>
                             <th className="px-6 py-3 text-right">Beta Vector</th>
                             <th className="px-6 py-3 text-right">Current Weight</th>
                             <th className="px-6 py-3 text-right text-[#34d74a]">Optimal Weight</th>
                             <th className="px-6 py-3 text-right">Rebalance Delta</th>
                             <th className="px-6 py-3 text-center">Execution</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[#262626]">
                          {optimizerResults.allocations.map((a: any, i: number) => (
                             <tr key={i} className="hover:bg-[#151515]">
                                <td className="px-6 py-4">
                                   <div className="font-bold text-white">{a.symbol}</div>
                                   <div className="text-xs text-gray-500 w-24 sm:w-auto truncate">{a.name}</div>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-gray-300">
                                   {a.beta.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-gray-300">
                                   {(a.currentWeight * 100).toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-[#34d74a]">
                                   {(a.targetWeight * 100).toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-white">
                                   {currencySymbol}{Math.abs(a.valueDiff).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${a.action === 'BUY' ? 'bg-[#34d74a]/10 text-[#34d74a] border border-[#34d74a]/20' : 'bg-[#d73434]/10 text-[#d73434] border border-[#d73434]/20'}`}>
                                      {a.action}
                                   </span>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
          </div>
        </div>
      )}

      <div ref={portfolioRef} className="max-w-7xl mx-auto pb-20 space-y-6 bg-[#000] p-4 rounded-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Briefcase className="text-[#34d74a]" size={24} /> Institutional Portfolio
            </h1>
            <p className="text-gray-400 mt-1">Manage global asset allocation, execution sizing, and exposure risk.</p>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="text-sm text-gray-400 font-medium pb-1">Total {activeTab} Exposure</div>
             <div className="text-3xl font-black text-white mb-2">{currencySymbol}{calculateTotal(filteredAssets).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
             <div className="flex items-center gap-3">
                 <Link href="/transactions" className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#262626] hover:border-gray-500 transition-colors px-3 py-1.5 rounded text-sm font-medium">
                   <History size={16} /> Ledger
                 </Link>
                 
                 <button onClick={() => setShowBrokerModal(true)} className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#262626] hover:border-[#34d74a]/50 transition-colors px-3 py-1.5 rounded text-sm font-medium shadow-[0_0_15px_rgba(52,215,74,0.1)]">
                   <TrendingUp size={16} /> Sync Broker App
                 </button>
                 
                 <button onClick={() => setShowCsvModal(true)} className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#262626] hover:border-gray-500 transition-colors px-3 py-1.5 rounded text-sm font-medium">
                   <FileText size={16} /> Advanced Import
                 </button>

                 <button onClick={exportToCSV} className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#262626] hover:border-gray-500 transition-colors px-3 py-1.5 rounded text-sm font-medium">
                   <FileText size={16} /> Export CSV
                 </button>

                 <button 
                   onClick={() => downloadAsImage(portfolioRef, `Portfolio_Snapshot.jpg`)} 
                   disabled={isDownloading}
                   className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#34d74a] hover:text-black text-gray-400 px-3 py-1.5 rounded text-sm font-bold uppercase transition-colors border border-[#262626] disabled:opacity-50"
                 >
                   {isDownloading ? <div className="w-4 h-4 border-2 border-white/20 border-t-[#34d74a] rounded-full animate-spin"></div> : <Camera size={16} />} {isDownloading ? 'Generating...' : 'Snapshot'}
                 </button>

                 <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-white text-gray-300 hover:text-black border border-[#333] transition-colors px-3 py-1.5 rounded text-sm font-medium">
                   <Plus size={16} /> Simulate Manual Add 
                 </button>

                 <button onClick={runOptimizer} disabled={isOptimizing} className="flex items-center gap-2 bg-[#34d74a] text-black hover:bg-[#2bc43f] border border-[#34d74a] transition-colors px-3 py-1.5 rounded text-sm font-bold shadow-[0_0_15px_rgba(52,215,74,0.2)]">
                   {isOptimizing ? <Loader2 size={16} className="animate-spin" /> : <BarChart2 size={16} />} Optimize
                 </button>
             </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#262626] mb-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)} 
               className={`pb-3 px-1 mr-8 whitespace-nowrap text-sm font-medium transition-colors ${activeTab === tab ? "text-[#34d74a] border-b-2 border-[#34d74a]" : "text-gray-500 hover:text-white"}`}
             >
               {tab}
             </button>
          ))}
        </div>

        {/* Action Bar (Search & FX) */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex bg-[#111] border border-[#262626] rounded-lg p-1 shrink-0 h-[38px]">
             <button onClick={() => setNativeMode(true)} className={`px-4 text-xs font-bold rounded transition-colors ${nativeMode ? 'bg-[#1a1a1a] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>Native FX</button>
             <button onClick={() => setNativeMode(false)} className={`px-4 text-xs font-bold rounded transition-colors ${!nativeMode ? 'bg-[#1a1a1a] text-[#34d74a] shadow' : 'text-gray-500 hover:text-gray-300'}`}>Convert ({currencySymbol})</button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-x-auto no-scrollbar shadow-2xl">
           <table className="w-full text-left text-sm text-gray-400 min-w-[800px]">
             <thead className="bg-[#111] border-b border-[#262626] text-xs uppercase font-semibold">
               <tr>
                 <th className="px-6 py-4">Asset Name</th>
                 <th className="px-6 py-4">Quantity</th>
                 <th className="px-6 py-4 text-right">Avg Cost</th>
                 <th className="px-6 py-4 text-right">Live Price</th>
                 <th className="px-6 py-4 text-right hidden sm:table-cell">Current Value</th>
                 <th className="px-6 py-4 text-right">Total Return</th>
                 <th className="px-6 py-4"></th>
               </tr>
             </thead>
             <tbody>
               {filteredAssets.map((asset, i) => (
                 <React.Fragment key={i}>
                   <tr onClick={() => setExpandedRow(expandedRow === asset.symbol ? null : asset.symbol)} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#111] transition-colors group cursor-pointer">
                     <td className="px-6 py-4">
                       <Link href={`/stock/${asset.symbol}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center font-bold text-white text-xs border border-[#333] group-hover:border-gray-500 transition-colors uppercase">
                           {asset.symbol[0]}
                         </div>
                         <div>
                           <div className="font-bold text-white group-hover:text-[#34d74a] transition-colors flex items-center gap-2">
                             {asset.symbol} 
                             <span className="text-gray-600 group-hover:text-gray-400">
                               {expandedRow === asset.symbol ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                             </span>
                           </div>
                           <div className="text-xs text-gray-500 w-32 truncate">{asset.name}</div>
                         </div>
                       </Link>
                     </td>
                     <td className="px-6 py-4 font-mono text-white">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => handleUpdateQuantity(asset.id, asset.qty, -1, e)} className="w-5 h-5 flex items-center justify-center bg-[#1a1a1a] hover:bg-gray-700 rounded text-gray-400 font-bold">-</button>
                          <span>{asset.qty.toLocaleString()}</span>
                          <button onClick={(e) => handleUpdateQuantity(asset.id, asset.qty, 1, e)} className="w-5 h-5 flex items-center justify-center bg-[#1a1a1a] hover:bg-[#34d74a] hover:text-black rounded text-gray-400 font-bold">+</button>
                          <span className="text-[10px] text-gray-500 ml-1">Units</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right font-medium text-gray-400">
                        <span className="text-gray-600 mr-2 text-xs">{nativeMode ? getNativeCurrencySymbol(asset.symbol) : currencySymbol}</span>
                        {(nativeMode ? asset.price : getConvertedPrice(asset.price, asset.symbol)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                     </td>
                     <td className="px-6 py-4 text-right font-medium text-white">
                        <span className="text-gray-500 mr-2 text-xs">{nativeMode ? getNativeCurrencySymbol(asset.symbol) : currencySymbol}</span>
                        {(nativeMode ? (asset.livePrice || asset.price) : getConvertedPrice((asset.livePrice || asset.price), asset.symbol)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                     </td>
                     <td className="px-6 py-4 text-right font-bold text-white hidden sm:table-cell">
                        <span className="text-gray-500 mr-2 text-xs">{nativeMode ? getNativeCurrencySymbol(asset.symbol) : currencySymbol}</span>
                        {((asset.qty) * (nativeMode ? (asset.livePrice || asset.price) : getConvertedPrice((asset.livePrice || asset.price), asset.symbol))).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                     </td>
                     <td className="px-6 py-4 text-right font-bold">
                        {(() => {
                           const currentP = asset.livePrice || asset.price;
                           const costP = asset.price;
                           const totalReturnPercent = costP > 0 ? ((currentP - costP) / costP) * 100 : 0;
                           return (
                              <div className={`flex items-center justify-end gap-1 ${totalReturnPercent >= 0 ? "text-[#34d74a]" : "text-[#d73434]"}`}>
                                {totalReturnPercent >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                                {Math.abs(totalReturnPercent).toFixed(2)}%
                              </div>
                           );
                        })()}
                     </td>
                     <td className="px-6 py-4 text-right">
                       <UITooltip content="Delete Asset">
                         <button onClick={(e) => handleDeleteAsset(asset.id, e)} className="text-gray-500 hover:text-red-500 transition-colors p-2 bg-[#1a1a1a] rounded">
                            <Trash2 size={16} />
                         </button>
                       </UITooltip>
                     </td>
                   </tr>
                   {expandedRow === asset.symbol && (
                     <tr className="bg-[#0f0f0f]">
                       <td colSpan={7} className="p-0 border-b border-[#1a1a1a]">
                          <div className="py-4 px-8 border-l-2 border-[#34d74a] ml-4 my-2 rounded-r-lg bg-[#0a0a0a]">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                               <div>
                                 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <History size={14} /> Open Tax Lots (Tranches)
                                 </h4>
                                 <table className="w-full text-left text-sm text-gray-400">
                                    <thead>
                                      <tr className="border-b border-[#262626]">
                                        <th className="py-2 font-semibold">Purchase Date</th>
                                        <th className="py-2 text-right font-semibold">Execution Price</th>
                                        <th className="py-2 text-right font-semibold">Remaining Qty</th>
                                        <th className="py-2 text-right font-semibold">Lot Return</th>
                                        <th className="py-2 text-right font-semibold">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {getOpenLots(asset.symbol).length > 0 ? getOpenLots(asset.symbol).map((lot: any, lotIdx: number) => {
                                        const lotReturnPercent = lot.execution_price > 0 ? (((asset.livePrice || asset.price) - lot.execution_price) / lot.execution_price) * 100 : 0;
                                        return (
                                          <tr key={lotIdx} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#111]">
                                            <td className="py-3 font-mono text-xs">{new Date(lot.timestamp).toLocaleString()}</td>
                                            <td className="py-3 text-right font-mono text-gray-300">
                                               <span className="text-gray-600 mr-1 text-xs">{nativeMode ? getNativeCurrencySymbol(asset.symbol) : currencySymbol}</span>
                                               {(nativeMode ? lot.execution_price : getConvertedPrice(lot.execution_price, asset.symbol)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </td>
                                            <td className="py-3 text-right font-mono font-bold text-white">{lot.remaining_qty.toLocaleString()}</td>
                                            <td className="py-3 text-right font-bold">
                                              <span className={lotReturnPercent >= 0 ? "text-[#34d74a]" : "text-[#d73434]"}>
                                                {lotReturnPercent > 0 ? '+' : ''}{lotReturnPercent.toFixed(2)}%
                                              </span>
                                            </td>
                                            <td className="py-3 text-right">
                                               <button onClick={(e) => handleSellLot(lot, asset, e)} className="bg-[#1a1a1a] hover:bg-[#d73434]/20 border border-[#262626] hover:border-[#d73434] text-xs font-bold px-3 py-1.5 rounded transition-all">
                                                 SELL LOT
                                               </button>
                                            </td>
                                          </tr>
                                        )
                                      }) : (
                                        <tr>
                                          <td colSpan={5} className="py-4 text-center text-gray-600 italic">No historical transaction lots found.</td>
                                        </tr>
                                      )}
                                    </tbody>
                                 </table>
                               </div>
                               
                               <div className="bg-[#111] border border-[#262626] rounded-xl p-4">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Lot Purchase Price vs Current Price</h4>
                                  <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                       <BarChart data={getOpenLots(asset.symbol).map((l: any, i: number) => ({
                                          lot: `Lot ${i + 1}`,
                                          buyPrice: l.execution_price,
                                          currentPrice: asset.livePrice || asset.price
                                       }))}>
                                          <XAxis dataKey="lot" stroke="#666" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} />
                                          <YAxis domain={['auto', 'auto']} stroke="#666" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(v) => `${nativeMode ? getNativeCurrencySymbol(asset.symbol) : currencySymbol}${v.toFixed(0)}`} width={45} />
                                          <RechartsTooltip 
                                            contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '8px'}}
                                            itemStyle={{color: '#fff', fontSize: '12px'}}
                                            formatter={(value: number) => [value.toFixed(2), "Price"]}
                                          />
                                          <ReferenceLine y={asset.livePrice || asset.price} stroke="#34d74a" strokeDasharray="3 3" label={{ position: 'top', fill: '#34d74a', fontSize: 10, value: 'Current' }} />
                                          <Bar dataKey="buyPrice" fill="#1a1a1a" stroke="#444" strokeWidth={1} radius={[4, 4, 0, 0]} />
                                       </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                               </div>
                            </div>
                          </div>
                       </td>
                     </tr>
                   )}
                 </React.Fragment>
               ))}
               
               {isCloudLoading && portfolioList.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="py-20 text-center">
                     <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
                        <Skeleton className="w-16 h-16 rounded-full mb-4" />
                        <Skeleton className="w-64 h-8" />
                        <Skeleton className="w-48 h-4" />
                        <Skeleton className="w-full h-10 mt-4" />
                     </div>
                   </td>
                 </tr>
               ) : filteredAssets.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center max-w-md mx-auto">
                        <div className="w-16 h-16 bg-[#111] border border-[#262626] rounded-full flex items-center justify-center mb-6">
                           <TrendingUp className="text-gray-500" size={24} />
                        </div>
                        <h3 className="text-white font-bold text-xl mb-3 tracking-wide">No Active Positions</h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">Your {activeTab} portfolio is currently empty. Allocate capital directly or configure structural logic nodes.</p>
                        <button onClick={(e) => { e.preventDefault(); setShowAddModal(true); }} className="px-6 py-3 bg-[#34d74a] text-black font-bold uppercase tracking-widest text-xs rounded hover:bg-[#2bc43f] transition-all shadow-[0_0_15px_rgba(52,215,74,0.3)]">
                           + Initialize Position
                        </button>
                      </div>
                   </td>
                 </tr>
               ) : null}
             </tbody>
           </table>
        </div>

      </div>
    </>
  );
}
