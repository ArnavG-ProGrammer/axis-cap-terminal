"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Briefcase, 
  History, 
  PieChart, 
  Settings, 
  Search,
  LogOut,
  Newspaper,
  ShieldCheck,
  Compass,
  Filter,
  Loader2,
  Repeat,
  X,
  Calendar,
  LayoutGrid,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean, setIsOpen?: (b: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

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
        
        if (data.quotes) {
           setSearchResults(data.quotes);
        } else {
           setSearchResults([]);
        }
      } catch (err) {
        console.error("Internal Proxy Error", err);
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentResults.length > 0) {
      router.push(`/stock/${currentResults[0].symbol}`);
      setSearchQuery('');
    } else if (searchQuery.trim()) {
      router.push(`/stock/${searchQuery.toUpperCase()}`);
      setSearchQuery('');
    }
  };

  const getFilteredResults = () => {
     if (activeFilter === 'ALL') return searchResults;
     return searchResults.filter(q => {
       if (activeFilter === 'EQUITY') return q.quoteType === 'EQUITY';
       if (activeFilter === 'CRYPTO') return q.quoteType === 'CRYPTOCURRENCY';
       if (activeFilter === 'FOREX') return q.quoteType === 'CURRENCY';
       if (activeFilter === 'FUNDS') return q.quoteType === 'ETF' || q.quoteType === 'MUTUALFUND';
       if (activeFilter === 'COMMODITIES') return q.quoteType === 'FUTURE' || q.quoteType === 'INDEX';
       return true;
     });
  };

  const currentResults = getFilteredResults();

  const navLinks = [
    { href: '/', icon: BarChart3, label: 'Dashboard' },
    { href: '/explorer', icon: Compass, label: 'Surf Market' },
    { href: '/portfolio', icon: Briefcase, label: 'Portfolio' },
    { href: '/transactions', icon: History, label: 'Transactions' },
    { href: '/assets', icon: PieChart, label: 'Assets' },
    { href: '/converter', icon: Repeat, label: 'FX Converter' },
    { href: '/news', icon: Newspaper, label: 'Macro News' },
    { href: '/screener', icon: SlidersHorizontal, label: 'Screener' },
    { href: '/heatmap', icon: LayoutGrid, label: 'Heatmap' },
    { href: '/calendar', icon: Calendar, label: 'Econ Calendar' },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-[#0a0a0a] border-r border-[#262626] flex flex-col z-[60] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 pb-2 relative">
          <div className="flex items-center justify-between mb-8 relative">
              <img 
                 src="/logo_transparent.png" 
                 alt="AXIS CAP" 
                 className="w-[70%] px-2 h-auto object-contain filter drop-shadow-[0_0_15px_rgba(52,215,74,0.2)]" 
              />
              <button 
                className="lg:hidden text-gray-400 hover:text-white p-1"
                onClick={() => setIsOpen && setIsOpen(false)}
              >
                <X size={20} />
              </button>
          </div>
          
          <div className="relative mb-6">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-3 text-gray-500" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] border border-[#262626] text-white rounded-md py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#34d74a] transition-colors text-sm"
                placeholder="Global Market Search..."
              />
              {isSearching && <Loader2 className="absolute right-3 top-3 text-gray-500 animate-spin" size={16} />}
            </form>

            {searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#111] border border-[#262626] shadow-2xl rounded-md z-[100] flex flex-col overflow-hidden">
                 
                 <div className="flex items-center border-b border-[#262626] p-2 gap-1 overflow-x-auto custom-scrollbar">
                   <Filter size={12} className="text-gray-500 mx-1 shrink-0" />
                   {['ALL', 'EQUITY', 'CRYPTO', 'FOREX', 'COMMODITIES'].map((f) => (
                      <button 
                        key={f}
                        type="button"
                        onClick={() => setActiveFilter(f)}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${activeFilter === f ? 'bg-[#34d74a] text-black' : 'text-gray-500 hover:text-white'}`}
                      >
                        {f}
                      </button>
                   ))}
                 </div>

                 <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                   {currentResults.length > 0 ? (
                     currentResults.map((ticker, i) => (
                       <Link 
                         key={i} 
                         href={`/stock/${ticker.symbol}`}
                         onClick={() => setSearchQuery("")}
                         className="px-4 py-3 hover:bg-[#1a1a1a] cursor-pointer flex flex-col border-b border-[#1a1a1a] last:border-0"
                       >
                         <div className="flex items-center justify-between">
                           <span className="text-white font-bold">{ticker.symbol}</span>
                           <span className="text-gray-500 text-[10px] rounded border border-[#262626] uppercase px-1 bg-[#0a0a0a]">{ticker.quoteType}</span>
                         </div>
                         <div className="flex items-center justify-between mt-1">
                           <span className="text-gray-500 text-xs w-32 truncate">{ticker.shortname || ticker.longname}</span>
                           <span className="text-gray-600 text-[9px] uppercase">{ticker.exchDisp}</span>
                         </div>
                       </Link>
                     ))
                   ) : (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        {isSearching ? "Querying Global Exchange..." : `No assets found.`}
                      </div>
                   )}
                 </div>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                  isActive 
                    ? 'bg-white text-black' 
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            );
          })}
          
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium mt-4 ${
                pathname === '/admin' 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                  : 'text-red-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <ShieldCheck size={18} />
              Admin Operations
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-[#262626] space-y-1">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors text-sm font-medium">
            <Settings size={18} />
            Settings
          </Link>
          <button onClick={async () => {
            const { supabase } = await import('@/lib/supabase');
            await supabase.auth.signOut();
            router.push('/login');
          }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium mt-2 border border-transparent hover:border-red-500/20">
            <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-xs font-bold text-white"><LogOut size={12}/></div>
            Secure Logout
          </button>
        </div>
      </aside>
    </>
  );
}
