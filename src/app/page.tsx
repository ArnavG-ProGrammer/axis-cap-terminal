"use client";

import React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, LineChart, Globe, PieChart, Sparkles } from "lucide-react";

export default function LandingPage() {
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
      <div className="bg-[#000000] min-h-screen text-white font-sans overflow-x-hidden selection:bg-[#C4571A]/30">
        
        {/* PHASE 1: HERO SECTION */}
        <section className="relative h-[100vh] min-h-[600px] flex flex-col justify-center items-center px-4 sm:px-6 z-10 text-center">
          <div className="absolute top-8 w-full flex justify-center">
            {/* Logo placeholder - using text to match brand */}
            <div className="font-black tracking-widest text-2xl uppercase">
              AXIS<span className="text-[#C4571A]">CAP</span>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-8 mt-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
              A Bloomberg-style terminal that's actually <span className="text-[#C4571A]">free</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 font-medium max-w-3xl mx-auto leading-relaxed">
              DCF models, portfolio tracking, sector heat maps, and live global markets. Professional-grade finance tools, built for everyone, not just Wall Street.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href="/login" className="px-8 py-4 bg-[#C4571A] hover:bg-[#a64713] text-white font-bold rounded-lg text-lg transition-colors w-full sm:w-auto shadow-[0_0_30px_rgba(196,87,26,0.3)] flex items-center justify-center gap-2">
                Get Started Free <ArrowRight size={20} />
              </Link>
              <button onClick={scrollToDemo} className="px-8 py-4 bg-transparent border border-gray-600 hover:border-white text-white font-bold rounded-lg text-lg transition-colors w-full sm:w-auto">
                See it in action
              </button>
            </div>
          </div>
        </section>

        {/* PHASE 2: DEMO SECTION */}
        <section id="demo-section" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">See AXISCAP in action.</h2>
            <div className="w-24 h-1 bg-[#C4571A] mx-auto rounded-full"></div>
          </div>
          
          <div className="w-full max-w-5xl mx-auto aspect-video bg-[#0a0a0a] border border-[#C4571A]/30 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-[0_0_50px_rgba(196,87,26,0.1)]">
            {/* VIDEO GOES HERE */}
            <p className="text-gray-500 font-mono tracking-widest uppercase animate-pulse">
              [ Demo video coming soon ]
            </p>
          </div>
        </section>

        {/* PHASE 3: FEATURES GRID */}
        <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-[#262626]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-8 hover:border-[#C4571A]/50 transition-colors group">
              <div className="w-12 h-12 bg-[#111] border border-[#262626] group-hover:border-[#C4571A]/50 transition-colors rounded-lg flex items-center justify-center mb-6">
                <LineChart className="text-[#C4571A]" size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3">DCF Valuation</h3>
              <p className="text-gray-400 leading-relaxed text-lg">
                Run full discounted cash flow models with sensitivity analysis.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-8 hover:border-[#C4571A]/50 transition-colors group">
              <div className="w-12 h-12 bg-[#111] border border-[#262626] group-hover:border-[#C4571A]/50 transition-colors rounded-lg flex items-center justify-center mb-6">
                <PieChart className="text-[#C4571A]" size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Portfolio Tracking</h3>
              <p className="text-gray-400 leading-relaxed text-lg">
                Track holdings, P&L, and allocation in real time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-8 hover:border-[#C4571A]/50 transition-colors group">
              <div className="w-12 h-12 bg-[#111] border border-[#262626] group-hover:border-[#C4571A]/50 transition-colors rounded-lg flex items-center justify-center mb-6">
                <Globe className="text-[#C4571A]" size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Live Global Markets</h3>
              <p className="text-gray-400 leading-relaxed text-lg">
                Real-time data across US, India, crypto, and FX.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-8 hover:border-[#C4571A]/50 transition-colors group">
              <div className="w-12 h-12 bg-[#111] border border-[#262626] group-hover:border-[#C4571A]/50 transition-colors rounded-lg flex items-center justify-center mb-6">
                <Sparkles className="text-[#C4571A]" size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Market Intelligence</h3>
              <p className="text-gray-400 leading-relaxed text-lg">
                Sector heat maps, alerts, and institutional-grade insight.
              </p>
            </div>

          </div>
        </section>

        {/* PHASE 4: CLOSING CTA & FOOTER */}
        <section className="py-24 px-4 sm:px-6 text-center border-t border-[#262626] bg-[#0a0a0a]">
          <h2 className="text-3xl md:text-5xl font-black mb-10 max-w-3xl mx-auto leading-tight">
            Stop paying $32,000 a year for a terminal. <br className="hidden md:block"/>
            <span className="text-[#C4571A]">AXISCAP is free.</span>
          </h2>
          <Link href="/login" className="inline-flex px-10 py-5 bg-[#C4571A] hover:bg-[#a64713] text-white font-bold rounded-lg text-xl transition-colors shadow-[0_0_30px_rgba(196,87,26,0.3)] items-center justify-center gap-3">
            Get Started Free <ArrowRight size={24} />
          </Link>
        </section>

        <footer className="py-12 border-t border-[#262626] text-center bg-[#000000]">
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
