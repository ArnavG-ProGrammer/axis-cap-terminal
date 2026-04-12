"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { Lock, Mail, Loader2, ArrowRight, User as UserIcon, Twitter, Linkedin } from 'lucide-react';

export default function LoginPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanEmail = email.trim();
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('Full Name is required for registration.');
        const { error } = await supabase.auth.signUp({ 
            email: cleanEmail, 
            password,
            options: {
              data: {
                  full_name: fullName.trim(),
                  role: 'user'
              }
            }
        });
        if (error) throw error;
        alert('Registration successful! Please sign in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication sequence aborted. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'twitter' | 'linkedin_oidc') => {
     setLoading(true);
     try {
       const { error } = await supabase.auth.signInWithOAuth({
         provider,
         options: { redirectTo: window.location.origin }
       });
       if (error) throw error;
     } catch (err: any) {
        setError(err.message || `${provider} OAuth sequence failed.`);
        setLoading(false);
     }
  };

  return (
    <div className="min-h-screen bg-[#000] flex items-center justify-center p-4 relative overflow-hidden">
      <Head>
        <title>Auth | AXIS CAP</title>
      </Head>

      {/* Nebula Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#34d74a] opacity-[0.03] rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d79734] opacity-[0.03] rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-8 relative">
            <img 
               src="/logo_transparent.png" 
               alt="AXIS CAP" 
               className="w-[85%] h-auto object-contain filter drop-shadow-[0_0_20px_rgba(52,215,74,0.3)]" 
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">Terminal Access</h1>
          <p className="text-gray-500 text-sm mt-1">Institutional Grade Financial Operations</p>
        </div>

        <form onSubmit={handleAuth} className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-[#262626] rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {isSignUp && (
              <div className="animate-fade-in transition-all">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-gray-500" size={18} />
                  <input 
                    type="text" 
                    required={isSignUp}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-[#d79734] transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="email" 
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-[#d79734] transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-[#d79734] transition-colors"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#d79734] to-[#a67425] hover:opacity-90 text-black font-black uppercase tracking-wider rounded-lg py-3.5 mt-2 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(215,151,52,0.2)]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                 isSignUp ? "Create Account" : "Sign In"
              )}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>

          <div className="my-6 flex items-center gap-4">
             <div className="h-px bg-[#262626] flex-1"></div>
             <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Or Continue With</span>
             <div className="h-px bg-[#262626] flex-1"></div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button 
               type="button" 
               onClick={() => handleOAuth('google')}
               disabled={loading}
               className="w-full bg-white hover:bg-gray-200 text-black font-bold uppercase tracking-wider rounded-lg py-3 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 text-sm"
            >
               <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
               Google
            </button>
            <button 
               type="button" 
               onClick={() => handleOAuth('linkedin_oidc')}
               disabled={loading}
               className="w-full bg-[#0a66c2] hover:bg-[#004182] text-white font-bold uppercase tracking-wider rounded-lg py-3 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 text-sm"
            >
               <Linkedin size={18} />
               LinkedIn
            </button>
            <button 
               type="button" 
               onClick={() => handleOAuth('twitter')}
               disabled={loading}
               className="w-full bg-black border border-[#333] hover:bg-[#111] text-white font-bold uppercase tracking-wider rounded-lg py-3 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 text-sm"
            >
               <Twitter size={18} />
               X / Twitter
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1a1a1a] text-center">
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gray-500 text-sm hover:text-white transition-colors"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
