"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { Lock, Mail, Loader2, ArrowRight, User as UserIcon } from 'lucide-react';

export default function LoginPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
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
      if (err.status === 429) {
        setError('Rate limit exceeded. Too many attempts. Please try again in 15 minutes.');
      } else {
        setError(err.message || 'Authentication sequence aborted. Check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/settings`,
      });
      if (error) throw error;
      setError('Password reset link sent to your email. Please check your inbox.');
    } catch (err: any) {
      if (err.status === 429) {
        setError('Rate limit exceeded. Please try again later.');
      } else {
        setError(err.message || 'Failed to send reset link.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'twitter' | 'linkedin_oidc' | 'apple') => {
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

        <form onSubmit={isForgotPassword ? handleResetPassword : handleAuth} className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-[#262626] rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className={`border p-3 rounded-lg text-sm mb-6 text-center ${error.includes('sent') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
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

            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Password</label>
                  {!isSignUp && (
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] text-[#34d74a] hover:text-white transition-colors uppercase tracking-widest">
                      Forgot?
                    </button>
                  )}
                </div>
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
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#d79734] to-[#a67425] hover:opacity-90 text-black font-black uppercase tracking-wider rounded-lg py-3.5 mt-2 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(215,151,52,0.2)]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                 isForgotPassword ? "Send Reset Link" : isSignUp ? "Create Account" : "Sign In"
              )}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>

          {!isForgotPassword && (
            <>
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
                   <svg fill="currentColor" width="18" height="18" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                   LinkedIn
                </button>
                <button 
                   type="button" 
                   onClick={() => handleOAuth('twitter')}
                   disabled={loading}
                   className="w-full bg-black border border-[#333] hover:bg-[#111] text-white font-bold uppercase tracking-wider rounded-lg py-3 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 text-sm"
                >
                   <svg fill="currentColor" width="18" height="18" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                   X / Twitter
                </button>
                <button 
                   type="button" 
                   onClick={() => handleOAuth('apple')}
                   disabled={loading}
                   className="w-full bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-wider rounded-lg py-3 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 text-sm"
                >
                   {/* App Store Compliance: Apple Sign-In */}
                   <svg fill="currentColor" width="18" height="18" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                   Sign in with Apple
                </button>
              </div>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-[#1a1a1a] text-center flex flex-col gap-3">
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setIsForgotPassword(false);
              }}
              className="text-gray-500 text-sm hover:text-white transition-colors"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
            
            {isForgotPassword && (
              <button 
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-[#34d74a] text-sm hover:text-white transition-colors"
              >
                Back to Sign In
              </button>
            )}

            {/* Apple App Store Compliance - Legal Consents */}
            <div className="mt-4 text-[10px] text-gray-600 px-4 leading-relaxed">
              By authenticating, you acknowledge that you have read and agree to our <br/>
              <a href="/terms" className="text-gray-400 hover:text-white underline transition-colors mx-1">Terms & Conditions</a> 
              and our 
              <a href="/privacy" className="text-gray-400 hover:text-white underline transition-colors mx-1">Privacy Policy</a>.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
