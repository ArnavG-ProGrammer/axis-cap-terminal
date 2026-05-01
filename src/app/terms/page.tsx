import Head from "next/head";
import Link from "next/link";
import { Scale, ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#000] text-gray-300 pb-20">
      <Head>
        <title>Terms & Conditions | AXIS CAP</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 pt-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest mb-12">
          <ArrowLeft size={16} /> Return to Terminal
        </Link>

        <div className="flex items-center gap-4 mb-8 border-b border-[#262626] pb-8">
          <div className="w-16 h-16 bg-[#111] border border-[#262626] rounded-2xl flex items-center justify-center">
            <Scale className="text-[#34d74a]" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-widest">Terms & Conditions</h1>
            <p className="text-gray-500 mt-2 font-mono text-sm">Effective Date: May 2026 | AXIS CAP Technologies</p>
          </div>
        </div>

        <div className="space-y-8 prose prose-invert max-w-none">
          <section className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">1. Acceptance of Terms</h2>
            <p className="leading-relaxed text-sm text-gray-400">
              By accessing the AXIS CAP Terminal, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service. The Terminal is strictly for informational and quantitative simulation purposes.
            </p>
          </section>

          <section className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">2. Non-Fiduciary Status & Risk Warning</h2>
            <p className="leading-relaxed text-sm text-gray-400 mb-4">
              <strong>AXIS CAP is not a registered broker, dealer, investment advisor, or fiduciary.</strong>
            </p>
            <p className="leading-relaxed text-sm text-gray-400">
              All Discounted Cash Flow (DCF) models, AI-generated theses, and Backtester simulations are mathematical projections. They do not constitute financial advice. Financial markets involve extreme risk, including the total loss of capital. You are solely responsible for executing trades through your own licensed brokerages based on your independent verification.
            </p>
          </section>

          <section className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">3. Acceptable Use & Rate Limiting</h2>
            <p className="leading-relaxed text-sm text-gray-400 mb-4">
              You agree not to deploy automated scrapers, bots, or brute-force scripts against our backend endpoints.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-400">
              <li>Authentication endpoints are strictly rate-limited to prevent unauthorized access.</li>
              <li>Intentional API abuse or circumvention of rate limiters will result in immediate and permanent hardware-level IP bans.</li>
            </ul>
          </section>

          <section className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">4. Third-Party Data Sources</h2>
            <p className="leading-relaxed text-sm text-gray-400">
              Pricing structures, OHLC matrices, and macroeconomic feeds are sourced from third-party exchanges via APIs (e.g., Yahoo Finance, Alpha Vantage). We do not guarantee the absolute latency, uptime, or correctness of these upstream providers.
            </p>
          </section>

          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center">
            <p className="text-sm text-red-400">
              Legal correspondence regarding these terms should be addressed directly to: <strong className="text-white">arnavsgoyal@gmail.com</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
