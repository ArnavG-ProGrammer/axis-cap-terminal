"use client";

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAuth } from '@/lib/AuthContext';
import { ShieldAlert, Users, Settings as SettingsIcon, Database, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const { isAdmin, user } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin === false) {
      router.push('/');
    } else if (isAdmin === true) {
      fetchData();
    }
  }, [isAdmin, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pure identity from profiles
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profileError) console.warn("Profiles fetch error - ensure SQL script is run.");
      
      // Fetch aggregate wealth from true user_portfolios
      const { data: portfolioData, error: portfolioError } = await supabase.from('user_portfolios').select('user_id, qty, price, type, symbol');
      if (portfolioError) console.warn("Portfolio fetch error - ensure admin RLS is bypassed.");

      setProfiles(profileData || []);
      setPortfolios(portfolioData || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return <div className="p-10 text-center text-gray-500">Verifying security clearance...</div>;
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  // Calculate each user's unique stats
  const enrichedProfiles = profiles.map(p => {
     const userAssets = portfolios.filter(asset => asset.user_id === p.id);
     const totalValue = userAssets.reduce((sum, asset) => sum + (Number(asset.qty) * Number(asset.price)), 0);
     
     // Deduplicate and strictly format asset types (e.g. Crypto, Mutual Fund)
     const assetTypes = Array.from(new Set(userAssets.map(a => a.type)));
     
     return {
        ...p,
        totalValue,
        assetCount: userAssets.length,
        assetTypes: assetTypes.length > 0 ? assetTypes.join(', ') : 'No Assets'
     };
  });

  const totalPlatformAUM = enrichedProfiles.reduce((acc, p) => acc + p.totalValue, 0);

  return (
    <>
      <Head>
        <title>Admin Operations | AXIS CAP</title>
      </Head>

      <div className="max-w-7xl mx-auto pb-20 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
               <ShieldAlert className="text-red-500" size={24} /> Admin Operations Center
            </h1>
            <p className="text-gray-400 mt-1">Platform management, comprehensive user audit logs, and global AUM metrics.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 hover:border-red-500/50 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500"><Users size={24}/></div>
                 <div>
                    <h3 className="text-white font-bold">Total Users</h3>
                    <p className="text-gray-500 text-xs">Registered accounts</p>
                 </div>
              </div>
              <p className="text-2xl text-white font-black">{loading ? '-' : profiles.length}</p>
           </div>
           
           <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 hover:border-[#34d74a]/50 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-[#34d74a]/10 flex items-center justify-center text-[#34d74a]"><Database size={24}/></div>
                 <div>
                    <h3 className="text-white font-bold">Total AUM</h3>
                    <p className="text-gray-500 text-xs">Platform Assets Under Management</p>
                 </div>
              </div>
              <p className="text-2xl text-[#34d74a] font-black">{loading ? '-' : formatCurrency(totalPlatformAUM)}</p>
           </div>

           <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 hover:border-[#d79734]/50 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-[#d79734]/10 flex items-center justify-center text-[#d79734]"><SettingsIcon size={24}/></div>
                 <div>
                    <h3 className="text-white font-bold">Global Parameters</h3>
                    <p className="text-gray-500 text-xs">Admin Session Info</p>
                 </div>
              </div>
              <p className="text-sm text-[#d79734] font-bold mt-2 truncate" title={user?.email}>{user?.email}</p>
           </div>
        </div>

        {/* User Data Table */}
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-[#262626] flex justify-between items-center bg-[#111]">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Client Directory & Financials</h2>
            <button onClick={fetchData} className="text-xs flex items-center gap-1 bg-[#1a1a1a] px-3 py-1.5 rounded text-[#d79734] hover:bg-[#d79734] hover:text-black uppercase tracking-widest font-bold transition-colors">
               <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh Data
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#050505] border-b border-[#262626] text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">User / Identity</th>
                  <th className="p-4 font-bold text-right">True Net Worth</th>
                  <th className="p-4 font-bold text-center">Asset Types</th>
                  <th className="p-4 font-bold text-center">Total Holdings</th>
                  <th className="p-4 font-bold text-right">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      <Loader2 className="animate-spin mx-auto mb-3" size={28} />
                      Aggregating Platform Portfolios...
                    </td>
                  </tr>
                ) : enrichedProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#d79734]">
                      No user data found! Ensure you run the updated supabase_setup.sql script.
                    </td>
                  </tr>
                ) : (
                  enrichedProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-[#111] transition-colors group">
                      <td className="p-4">
                        <div className="text-white font-bold flex items-center gap-2">
                           {p.full_name || 'Incognito User'}
                           {p.email === 'arnavsgoyal@gmail.com' && <ShieldAlert size={12} className="text-red-500" />}
                        </div>
                        <div className="text-gray-500 text-xs">{p.email}</div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-[#34d74a] font-black tracking-wider text-lg">{formatCurrency(p.totalValue)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold uppercase text-[#d79734]">
                          {p.assetTypes}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1a1a1a] text-white shadow-inner">
                          {p.assetCount} assets
                        </span>
                      </td>
                      <td className="p-4 text-right text-gray-400 text-sm font-mono">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
