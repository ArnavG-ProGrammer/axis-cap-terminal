"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { User, Loader2, Save, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, session } = useAuth();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      });

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Profile identity synchronized successfully. Navigating back...' });
      
      // Navigate back after a short delay so user sees success message
      setTimeout(() => {
          router.push('/');
          // Force a full refresh to re-evaluate the initials globally
          window.location.reload(); 
      }, 1500);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : 'AU';
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Head>
        <title>Profile Settings | AXIS CAP</title>
      </Head>

      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-white transition-colors text-sm font-bold tracking-widest uppercase mb-6">
          <ArrowLeft size={16} className="mr-2" /> Return to Terminal
        </Link>
        <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
          <User className="text-[#34d74a]" size={32} />
          Identity Management
        </h1>
        <p className="text-gray-500 mt-2 text-sm max-w-xl leading-relaxed">
          Configure your institutional display name. This identity will be utilized across the AXIS CAP quantum terminal and ledger systems.
        </p>
      </div>

      <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Aesthetic Background Glare */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#34d74a] opacity-[0.03] rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-10 items-start">
           
           {/* Avatar Preview */}
           <div className="flex flex-col items-center gap-4 border border-[#262626] bg-[#111] p-8 rounded-2xl shrink-0 w-full md:w-auto">
              <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border border-[#333] shadow-[0_0_20px_rgba(52,215,74,0.1)] flex items-center justify-center text-3xl font-black tracking-widest text-[#34d74a]">
                 {getInitials(fullName || user?.email || '')}
              </div>
              <div className="text-center">
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Active Identity</p>
                 <p className="text-white font-medium mt-1 truncate max-w-[150px]">{user?.email}</p>
              </div>
           </div>

           {/* Form */}
           <form onSubmit={handleUpdateProfile} className="flex-1 w-full space-y-6">
              {message && (
                <div className={`p-4 rounded-xl border text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                   {message.type === 'success' ? <Shield size={16} /> : null}
                   {message.text}
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <UserIcon size={14} /> Full Legal Name / Display Alias
                 </label>
                 <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-[#34d74a] focus:ring-1 focus:ring-[#34d74a]/50 transition-all font-medium"
                    placeholder="e.g. Arnav Goyal"
                 />
                 <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">The first two letters will form your terminal avatar.</p>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={14} /> Authenticated Email
                 </label>
                 <input 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-[#111]/50 border border-[#222] text-gray-500 rounded-xl py-3.5 px-4 cursor-not-allowed font-mono text-sm"
                 />
              </div>

              <div className="pt-4 border-t border-[#262626]">
                 <button 
                    type="submit" 
                    disabled={loading || !fullName.trim()}
                    className="bg-[#34d74a] hover:bg-[#2cb23d] text-black font-black uppercase tracking-widest rounded-xl py-4 px-8 flex items-center justify-center gap-2 transition-all disabled:opacity-50 w-full md:w-auto shadow-[0_0_20px_rgba(52,215,74,0.2)]"
                 >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Synchronize Identity
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
// Using an alias for the icon inside the label
const UserIcon = User;
