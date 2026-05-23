"use client";

import React, { useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, LineChart, Globe, PieChart, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

// Lightweight Intersection Observer hook for scroll animations
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-visible", "true");
          // Optional: observer.unobserve(entry.target) if you only want it to animate once
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return ref;
}

// A reusable section wrapper to apply the fade-up animation consistently
function FadeSection({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const ref = useScrollAnimation();
  return (
    <div 
      ref={ref} 
      className={`opacity-0 translate-y-8 data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0 transition-all duration-1000 ease-out ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  
  const scrollToDemo = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const element = document.getElementById("demo-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <Head>
        <title>AXIS CAP | Institutional Quantitative Terminal</title>
      </Head>
      <div className="bg-[#000000] min-h-screen text-white font-sans overflow-x-hidden selection:bg-[#C4571A]/30 relative">
        
        {/* GLOBAL BACKGROUND TEXTURE */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-20"
             style={{ backgroundImage: 'linear-gradient(to right, #ffffff08 1px, transparent 1px), linear-gradient(to bottom, #ffffff08 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* SUBTLE RADIAL GLOW FOR HERO */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#C4571A]/15 blur-[150px] rounded-full pointer-events-none z-0" />

        {/* STICKY TOP NAVIGATION */}
        <nav className="fixed top-0 w-full z-50 bg-[#000000]/80 backdrop-blur-md border-b border-[#262626]/50">
          <div className="max-w-7xl mx-auto px-6 sm:px-12 h-20 flex justify-between items-center">
            {/* Text Logo */}
            <div className="font-black tracking-widest text-xl uppercase">
              AXIS<span className="text-[#C4571A]">CAP</span>
            </div>
            {/* Smart Button */}
            {isAuthenticated ? (
              <Link href="/dashboard" className="px-6 py-2.5 bg-[#C4571A] hover:bg-[#a64713] text-white font-bold rounded-lg text-sm transition-all hover:shadow-[0_0_20px_rgba(196,87,26,0.4)]">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-gray-300 hover:text-white font-semibold transition-colors text-sm">
                Sign In
              </Link>
            )}
          </div>
        </nav>

        {/* PHASE 1: HERO SECTION */}
        <section className="relative pt-40 pb-16 px-4 sm:px-6 z-10 text-center flex flex-col items-center min-h-screen">
          <FadeSection className="max-w-4xl mx-auto space-y-8 mt-12">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
              A Bloomberg-style terminal that's actually <span className="text-[#C4571A]">free</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 font-medium max-w-3xl mx-auto leading-relaxed">
              DCF models, portfolio tracking, sector heat maps, and live global markets. Professional-grade finance tools, built for everyone, not just Wall Street.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link href={isAuthenticated ? "/dashboard" : "/login"} className="px-8 py-4 bg-[#C4571A] hover:bg-[#a64713] text-white font-bold rounded-lg text-lg transition-all w-full sm:w-auto shadow-[0_0_30px_rgba(196,87,26,0.3)] hover:shadow-[0_0_40px_rgba(196,87,26,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2">
                {isAuthenticated ? "Open Terminal" : "Get Started Free"} <ArrowRight size={20} />
              </Link>
              <button onClick={scrollToDemo} className="px-8 py-4 bg-[#111111] border border-gray-700 hover:border-gray-400 hover:bg-[#1a1a1a] text-white font-bold rounded-lg text-lg transition-all w-full sm:w-auto hover:-translate-y-0.5">
                See it in action
              </button>
            </div>
          </FadeSection>

          {/* DASHBOARD SCREENSHOT PLACEHOLDER */}
          <FadeSection className="w-full max-w-5xl mx-auto mt-20 relative z-20 group">
            <div className="absolute -inset-1 bg-gradient-to-b from-[#C4571A]/30 to-transparent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition duration-1000"></div>
            <div className="relative bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden shadow-2xl transform perspective-1000 rotate-x-1 hover:rotate-x-0 transition-transform duration-700">
              {/* Fake Browser Chrome */}
              <div className="h-10 bg-[#111] border-b border-[#262626] flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-[#111] to-[#050505] flex flex-col items-center justify-center text-gray-600 border-t border-white/5 relative">
                {/* DASHBOARD SCREENSHOT GOES HERE */}
                {/* Replace the content of this div with an actual <img src="..." className="absolute inset-0 w-full h-full object-cover" /> */}
                <LineChart size={48} className="mb-4 opacity-20" />
                <p className="font-mono tracking-widest text-sm uppercase opacity-50">[ Dashboard Screenshot Placeholder ]</p>
              </div>
            </div>
          </FadeSection>

          {/* STATS / TRUST ROW */}
          <FadeSection className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 mt-20 text-gray-400 text-sm md:text-base font-medium tracking-wide">
            <div className="flex items-center gap-2"><Globe size={16} className="text-[#C4571A]" /> Live global market data</div>
            <div className="hidden md:block w-px h-4 bg-gray-700"></div>
            <div className="flex items-center gap-2"><LineChart size={16} className="text-[#C4571A]" /> DCF + sensitivity modeling</div>
            <div className="hidden md:block w-px h-4 bg-gray-700"></div>
            <div className="flex items-center gap-2"><Sparkles size={16} className="text-[#C4571A]" /> 100% free, no card required</div>
          </FadeSection>
        </section>

        {/* PHASE 2: DEMO SECTION */}
        <section id="demo-section" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10 border-t border-[#262626]/50">
          <FadeSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-6">See AXISCAP in action.</h2>
              <div className="w-20 h-1 bg-[#C4571A] mx-auto rounded-full shadow-[0_0_15px_rgba(196,87,26,0.8)]"></div>
            </div>
            
            <div className="w-full max-w-5xl mx-auto relative">
              <div className="absolute -inset-0.5 bg-[#C4571A] rounded-2xl blur opacity-20"></div>
              <div className="relative aspect-video bg-[#0a0a0a] border border-[#C4571A]/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(196,87,26,0.15)] ring-1 ring-white/5">
                <video 
                  src="/demo-video.mp4" 
                  controls 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </FadeSection>
        </section>

        {/* PHASE 3: FEATURES GRID */}
        <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10 border-t border-[#262626]/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <FadeSection className="h-full">
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-8 hover:-translate-y-1 hover:border-[#C4571A]/50 hover:shadow-[0_8px_30px_rgba(196,87,26,0.1)] transition-all duration-300 group relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4571A]/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity group-hover:bg-[#C4571A]/10"></div>
                <div className="w-12 h-12 bg-[#111] border border-[#262626] group-hover:border-[#C4571A]/50 transition-colors rounded-lg flex items-center justify-center mb-6 relative z-10">
                  <LineChart className="text-[#C4571A]" size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-3 relative z-10">DCF Valuation</h3>
                <p className="text-gray-400 leading-relaxed text-lg relative z-10">
                  Run full discounted cash flow models with sensitivity analysis.
                </p>
              </div>
            </FadeSection>

            <FadeSection className="h-full">
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-8 hover:-translate-y-1 hover:border-[#C4571A]/50 hover:shadow-[0_8px_30px_rgba(196,87,26,0.1)] transition-all duration-300 group relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4571A]/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity group-hover:bg-[#C4571A]/10"></div>
                <div className="w-12 h-12 bg-[#111] border border-[#262626] group-hover:border-[#C4571A]/50 transition-colors rounded-lg flex items-center justify-center mb-6 relative z-10">
                  <PieChart className="text-[#C4571A]" size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-3 relative z-10">Portfolio Tracking</h3>
                <p className="text-gray-400 leading-relaxed text-lg relative z-10">
                  Track holdings, P&L, and allocation in real time.
                </p>
              </div>
            </FadeSection>

            <FadeSection className="h-full">
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-8 hover:-translate-y-1 hover:border-[#C4571A]/50 hover:shadow-[0_8px_30px_rgba(196,87,26,0.1)] transition-all duration-300 group relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4571A]/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity group-hover:bg-[#C4571A]/10"></div>
                <div className="w-12 h-12 bg-[#111] border border-[#262626] group-hover:border-[#C4571A]/50 transition-colors rounded-lg flex items-center justify-center mb-6 relative z-10">
                  <Globe className="text-[#C4571A]" size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-3 relative z-10">Live Global Markets</h3>
                <p className="text-gray-400 leading-relaxed text-lg relative z-10">
                  Real-time data across US, India, crypto, and FX.
                </p>
              </div>
            </FadeSection>

            <FadeSection className="h-full">
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-8 hover:-translate-y-1 hover:border-[#C4571A]/50 hover:shadow-[0_8px_30px_rgba(196,87,26,0.1)] transition-all duration-300 group relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4571A]/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity group-hover:bg-[#C4571A]/10"></div>
                <div className="w-12 h-12 bg-[#111] border border-[#262626] group-hover:border-[#C4571A]/50 transition-colors rounded-lg flex items-center justify-center mb-6 relative z-10">
                  <Sparkles className="text-[#C4571A]" size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-3 relative z-10">Market Intelligence</h3>
                <p className="text-gray-400 leading-relaxed text-lg relative z-10">
                  Sector heat maps, alerts, and institutional-grade insight.
                </p>
              </div>
            </FadeSection>

          </div>
        </section>

        {/* PHASE 4: CLOSING CTA & FOOTER */}
        <section className="py-24 px-4 sm:px-6 text-center border-t border-[#262626]/50 bg-[#050505] relative z-10">
          <FadeSection>
            <h2 className="text-3xl md:text-5xl font-black mb-10 max-w-3xl mx-auto leading-tight">
              Stop paying $32,000 a year for a terminal. <br className="hidden md:block"/>
              <span className="text-[#C4571A]">AXISCAP is free.</span>
            </h2>
            <Link href={isAuthenticated ? "/dashboard" : "/login"} className="inline-flex px-10 py-5 bg-[#C4571A] hover:bg-[#a64713] text-white font-bold rounded-lg text-xl transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(196,87,26,0.3)] hover:shadow-[0_0_40px_rgba(196,87,26,0.5)] items-center justify-center gap-3">
              {isAuthenticated ? "Open Terminal" : "Get Started Free"} <ArrowRight size={24} />
            </Link>
          </FadeSection>
        </section>

        <footer className="py-12 border-t border-[#262626] text-center bg-[#000000] relative z-10">
          <div className="font-black tracking-widest text-lg uppercase mb-2">
            AXIS<span className="text-[#C4571A]">CAP</span>
          </div>
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Haming_Os Industries
          </p>
        </footer>

      </div>
    </>
  );
}
