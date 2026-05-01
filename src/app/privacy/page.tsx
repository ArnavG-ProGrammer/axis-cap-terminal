import Head from "next/head";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#000] text-gray-300 pb-20">
      <Head>
        <title>Privacy Policy | AXIS CAP</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 pt-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest mb-12">
          <ArrowLeft size={16} /> Return to Terminal
        </Link>

        <div className="flex items-center gap-4 mb-8 border-b border-[#262626] pb-8">
          <div className="w-16 h-16 bg-[#111] border border-[#262626] rounded-2xl flex items-center justify-center">
            <Shield className="text-[#34d74a]" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-widest">Privacy Policy</h1>
            <p className="text-gray-500 mt-2 font-mono text-sm">Last Updated: May 2026 | Compliant with GDPR (EU) & DPDP Act 2023</p>
          </div>
        </div>

        <div className="space-y-8 prose prose-invert max-w-none">
          <section className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">1. Information We Collect</h2>
            <p className="leading-relaxed mb-4">
              When you onboard to the AXIS CAP Terminal, we securely collect identity markers facilitated by our OAuth providers (Google, X, LinkedIn) and your explicit inputs:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-400">
              <li><strong>Identity Data:</strong> Name, Email Address, and Avatar.</li>
              <li><strong>Financial Metadata:</strong> Manual portfolio inputs, API configurations, and trading preferences.</li>
              <li><strong>Telemetry Data:</strong> IP Address, browser type, and terminal interaction logs (strictly for security and brute-force mitigation).</li>
            </ul>
          </section>

          <section className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">2. Data Isolation & Security (Supabase)</h2>
            <p className="leading-relaxed text-sm text-gray-400">
              All quantitative metrics, transactional arrays, and chat histories are routed directly to isolated PostgreSQL tables via Supabase. We employ <strong>Row-Level Security (RLS)</strong> meaning your portfolio is cryptographically walled off from all other actors on the terminal. We do not sell, rent, or lease your quantitative execution data to third-party institutions.
            </p>
          </section>

          <section className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">3. Artificial Intelligence (Gemini Integration)</h2>
            <p className="leading-relaxed text-sm text-gray-400">
              Our terminal utilizes Google's Gemini LLM for quantitative thesis generation. Your structural portfolio data is <strong>never</strong> used to train Google's models. We sanitize all payloads sent to the `ai-analysis` endpoints, transmitting only absolute ticker metrics and mathematical formulas, explicitly stripped of PII.
            </p>
          </section>

          <section className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">4. User Rights (GDPR)</h2>
            <p className="leading-relaxed mb-4 text-sm text-gray-400">
              Under the General Data Protection Regulation (GDPR), you possess the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-400">
              <li><strong>Right to Erasure:</strong> You can irrevocably wipe your portfolio, transactions, and session history via the 'Danger Zone' in Settings.</li>
              <li><strong>Right to Portability:</strong> You may request an export of your JSON/CSV database structures.</li>
            </ul>
          </section>

          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center">
            <p className="text-sm text-red-400">
              For direct DPO (Data Protection Officer) inquiries, breach reporting, or data deletion protocols, please contact: <strong className="text-white">arnavsgoyal@gmail.com</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
