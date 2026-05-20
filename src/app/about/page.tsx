import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Activity, Shield, BarChart2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#000] text-white flex flex-col items-center justify-center p-6">
      <Head>
        <title>About AXIS CAP | Institutional Terminal</title>
      </Head>

      <div className="max-w-4xl w-full space-y-12 text-center">
        {/* Header */}
        <div>
          <h1 className="text-5xl font-black tracking-tighter mb-4">
            AXIS <span className="text-[#34d74a]">CAP</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Advanced institutional financial research, real-time algorithmic backtesting, and secure portfolio management.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-12">
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 hover:border-[#34d74a] transition-colors">
            <Activity className="text-[#34d74a] mb-4" size={32} />
            <h3 className="text-lg font-bold mb-2">Real-Time Data</h3>
            <p className="text-gray-400 text-sm">Access live market data across equities, cryptocurrencies, forex, and commodities seamlessly.</p>
          </div>
          
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 hover:border-[#34d74a] transition-colors">
            <BarChart2 className="text-[#34d74a] mb-4" size={32} />
            <h3 className="text-lg font-bold mb-2">Quantitative Analysis</h3>
            <p className="text-gray-400 text-sm">Automated DCF valuations, volatility indexing, and AI-driven predictive insights.</p>
          </div>
          
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 hover:border-[#34d74a] transition-colors">
            <Shield className="text-[#34d74a] mb-4" size={32} />
            <h3 className="text-lg font-bold mb-2">Bank-Grade Security</h3>
            <p className="text-gray-400 text-sm">Protected by Supabase Row-Level Security and Google OAuth 2.0 authentication.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-12">
          <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-[#34d74a] text-black font-bold uppercase tracking-widest px-8 py-4 rounded-lg hover:bg-[#2bc43f] transition-all hover:scale-105">
            Launch Terminal <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
