"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Bell, Globe, ChevronDown, Menu } from 'lucide-react';
import { useCurrency } from './CurrencyContext';
import { useAuth } from '@/lib/AuthContext';

export default function TopNav({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [time, setTime] = useState<Date | null>(null);
  const { currency, setCurrency } = useCurrency();
  const { user } = useAuth();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "AU";
  const initials = userName.substring(0, 2).toUpperCase();

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCurrencyOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setAlertsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeAlerts = [
    { title: "TSLA Execution Alert", text: "TSLA dropped below rigid $180.00 liquidation bound.", priority: "HIGH" },
    { title: "NVDA Volatility Sync", text: "Q3 algorithmic earnings projection mismatch evaluated.", priority: "MED" },
    { title: "Portfolio Sync", text: "Database ledger successfully appended daily closures.", priority: "LOW" },
  ];

  const formatTime = (timeZone: string) => {
    if (!time) return "--:--:--";
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(time);
  };

  const zones = [
    { label: "NYC", tz: "America/New_York", color: "text-gray-400" },
    { label: "TOR", tz: "America/Toronto", color: "text-gray-400" },
    { label: "SAO", tz: "America/Sao_Paulo", color: "text-gray-400" },
    { label: "LON", tz: "Europe/London", color: "text-gray-400" },
    { label: "FRA", tz: "Europe/Berlin", color: "text-gray-400" },
    { label: "ZUR", tz: "Europe/Zurich", color: "text-gray-400" },
    { label: "DXB", tz: "Asia/Dubai", color: "text-gray-400" },
    { label: "MUM", tz: "Asia/Kolkata", color: "text-[#d76034] font-bold" },
    { label: "SGP", tz: "Asia/Singapore", color: "text-gray-400" },
    { label: "HKG", tz: "Asia/Hong_Kong", color: "text-gray-400" },
    { label: "TOK", tz: "Asia/Tokyo", color: "text-gray-400" },
    { label: "SYD", tz: "Australia/Sydney", color: "text-gray-400" }
  ];

  const currencies = ["USD", "EUR", "INR", "GBP", "JPY", "CAD"];

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#262626] flex items-center justify-between px-4 sm:px-6 z-40 transition-all">
      
      {/* 12+ GLOBAL CLOCKS MARQUEE */}
      <div className="flex-1 flex items-center gap-4 sm:gap-6 text-sm font-medium overflow-x-auto no-scrollbar whitespace-nowrap pr-8 mask-image-linear-right">
        
        {/* Mobile Hamburger Anchor */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden text-gray-400 hover:text-white mr-2"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-2 mr-2 sticky left-0 bg-[#0a0a0a]/90 z-10 pr-2">
            <Globe className="text-gray-500" size={16} />
            <span className="text-gray-300 font-semibold tracking-wider text-xs">GLOBAL</span>
        </div>
        
        {zones.map(z => (
          <span key={z.label} className="flex items-center gap-2">
            <span className={`text-[10px] sm:text-xs uppercase ${z.color}`}>{z.label}</span> 
            <span className="text-white font-mono text-sm w-[68px]">{formatTime(z.tz)}</span> 
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 bg-[#0a0a0a] pl-4 z-20 shadow-[-10px_0_10px_#0a0a0a]">
        
        {/* CUSTOM DROPDOWN CURRENCY TOGGLE */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setCurrencyOpen(!currencyOpen)}
            className="flex items-center border border-[#262626] rounded-md bg-[#111] px-3 py-1.5 cursor-pointer hover:border-[#34d74a] transition-all"
          >
             <span className="text-xs font-bold text-white mr-2">{currency}</span>
             <ChevronDown size={14} className="text-gray-400" />
          </div>
          
          {currencyOpen && (
            <div className="absolute top-full right-0 mt-1 w-24 bg-[#111] border border-[#262626] rounded-md shadow-xl overflow-hidden z-50">
              {currencies.map(c => (
                <div 
                  key={c}
                  onClick={() => { setCurrency(c); setCurrencyOpen(false); }}
                  className={`px-3 py-2 text-xs font-bold cursor-pointer hover:bg-[#1a1a1a] transition-colors ${currency === c ? 'text-[#34d74a] bg-[#1a1a1a]' : 'text-gray-400'}`}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GLOBAL NOTIFICATION ENGINE */}
        <div className="relative" ref={alertsRef}>
          <button 
             onClick={() => setAlertsOpen(!alertsOpen)}
             className={`text-gray-400 hover:text-white transition-colors p-2 relative rounded-md ${alertsOpen ? 'bg-[#1a1a1a] text-white' : ''}`}
          >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#d73434] rounded-full animate-pulse"></span>
          </button>
          
          {alertsOpen && (
             <div className="absolute top-full right-0 mt-2 w-80 bg-[#111] border border-[#262626] rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="bg-[#1a1a1a] border-b border-[#262626] px-4 py-3 flex justify-between items-center">
                   <span className="text-white text-xs font-bold uppercase tracking-widest">Active System Alerts</span>
                   <span className="text-[10px] text-gray-500 bg-[#0a0a0a] px-2 py-0.5 rounded border border-[#262626] font-mono">{activeAlerts.length}</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                   {activeAlerts.map((alert, i) => (
                      <div key={i} className="p-4 border-b border-[#262626] last:border-0 hover:bg-[#151515] transition-colors cursor-pointer group">
                         <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-1">
                               {alert.priority === 'HIGH' && <div className="w-2.5 h-2.5 rounded-full bg-[#d73434] shadow-[0_0_8px_rgba(215,52,52,0.6)]"></div>}
                               {alert.priority === 'MED' && <div className="w-2.5 h-2.5 rounded-full bg-[#d7b234] shadow-[0_0_8px_rgba(215,178,52,0.6)]"></div>}
                               {alert.priority === 'LOW' && <div className="w-2.5 h-2.5 rounded-full bg-[#34d74a] shadow-[0_0_8px_rgba(52,215,74,0.6)]"></div>}
                            </div>
                            <div>
                               <h4 className="text-white text-sm font-bold mb-1 group-hover:text-[#34d74a] transition-colors">{alert.title}</h4>
                               <p className="text-gray-400 text-xs leading-relaxed">{alert.text}</p>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
                <div className="bg-[#0a0a0a] border-t border-[#262626] p-2 text-center">
                   <button className="text-[10px] uppercase text-gray-500 hover:text-white tracking-widest font-bold">Clear All Diagnostics</button>
                </div>
             </div>
          )}
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-[#262626] ml-2">
          <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center text-sm font-bold text-white border border-[#333]" title={userName}>
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
