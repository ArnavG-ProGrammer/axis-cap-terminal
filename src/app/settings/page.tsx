"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import { Settings, User, Shield, Bell, Palette, Globe, LogOut, Check, Loader2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/components/CurrencyContext";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Settings State
  const [displayName, setDisplayName] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setDisplayName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "");
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update display name in Supabase auth metadata
      await supabase.auth.updateUser({
        data: { full_name: displayName }
      });

      // Update currency preference
      if (selectedCurrency !== currency) {
        setCurrency(selectedCurrency);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "⚠️ This will permanently delete all your portfolio data, transactions, and chat history. This action CANNOT be undone. Are you absolutely sure?"
    );
    if (!confirmed) return;

    try {
      if (user) {
        // Delete user data from all tables
        await Promise.all([
          supabase.from("user_portfolios").delete().eq("user_id", user.id),
          supabase.from("user_transactions").delete().eq("user_id", user.id),
          supabase.from("user_chat_history").delete().eq("user_id", user.id),
        ]);
      }
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Account deletion failed", err);
    }
  };

  const currencies = [
    { code: "USD", label: "US Dollar", symbol: "$" },
    { code: "INR", label: "Indian Rupee", symbol: "₹" },
    { code: "EUR", label: "Euro", symbol: "€" },
    { code: "GBP", label: "British Pound", symbol: "£" },
    { code: "JPY", label: "Japanese Yen", symbol: "¥" },
    { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-[#34d74a]" size={32} />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Settings | AXIS CAP</title>
      </Head>

      <div className="max-w-4xl mx-auto pb-20 space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Settings className="text-[#34d74a]" size={28} /> Terminal Settings
          </h1>
          <p className="text-gray-400 mt-1">Configure your terminal preferences, notifications, and account security.</p>
        </div>

        {/* Profile Section */}
        <section className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
            <User className="text-[#34d74a]" size={20} />
            <h2 className="text-white font-bold uppercase tracking-wider text-sm">Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#34d74a] transition-colors"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">Email Address</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full bg-[#111] border border-[#262626] rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-600 mt-1">Email is managed via your authentication provider</p>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">Auth Provider</label>
            <div className="flex items-center gap-3">
              <span className="bg-[#111] border border-[#262626] px-4 py-2 rounded-lg text-sm text-gray-300 font-medium">
                {user?.app_metadata?.provider === "google" ? "🔵 Google OAuth" :
                 user?.app_metadata?.provider === "linkedin_oidc" ? "🔷 LinkedIn OIDC" :
                 user?.app_metadata?.provider === "twitter" ? "⬛ X / Twitter" :
                 "📧 Email & Password"}
              </span>
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Verified ✓</span>
            </div>
          </div>
        </section>

        {/* Currency & Display Section */}
        <section className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
            <Globe className="text-[#34d74a]" size={20} />
            <h2 className="text-white font-bold uppercase tracking-wider text-sm">Currency & Display</h2>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 block">Default Currency</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currencies.map(c => (
                <button
                  key={c.code}
                  onClick={() => setSelectedCurrency(c.code)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedCurrency === c.code
                      ? "bg-[#34d74a]/10 border-[#34d74a] text-[#34d74a] shadow-[0_0_15px_rgba(52,215,74,0.1)]"
                      : "bg-[#111] border-[#262626] text-gray-400 hover:border-gray-500 hover:text-white"
                  }`}
                >
                  <div className="text-lg font-bold">{c.symbol}</div>
                  <div className="text-xs font-medium mt-1">{c.code}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{c.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 block">Terminal Theme</label>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                  theme === "dark"
                    ? "bg-[#111] border-[#34d74a] text-white shadow-[0_0_15px_rgba(52,215,74,0.1)]"
                    : "bg-[#111] border-[#262626] text-gray-500"
                }`}
              >
                <Palette size={20} className="mx-auto mb-2" />
                <div className="text-sm font-bold">Dark Mode</div>
                <div className="text-[10px] text-gray-500">Institutional Standard</div>
              </button>
              <button
                disabled
                className="flex-1 p-4 rounded-xl border bg-[#111] border-[#262626] text-gray-600 cursor-not-allowed opacity-50"
              >
                <Palette size={20} className="mx-auto mb-2" />
                <div className="text-sm font-bold">Light Mode</div>
                <div className="text-[10px]">Coming Soon</div>
              </button>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
            <Bell className="text-[#34d74a]" size={20} />
            <h2 className="text-white font-bold uppercase tracking-wider text-sm">Notifications</h2>
          </div>

          <div className="space-y-4">
            {[
              { label: "Email Notifications", desc: "Receive system alerts and updates via email", state: emailNotifications, set: setEmailNotifications, icon: Mail },
              { label: "Price Alert Triggers", desc: "Get notified when your price alerts are hit", state: priceAlerts, set: setPriceAlerts, icon: Bell },
              { label: "Daily Portfolio Digest", desc: "Receive a daily summary of your portfolio performance", state: dailyDigest, set: setDailyDigest, icon: Globe },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-[#111] rounded-xl border border-[#262626] hover:border-gray-600 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                    <item.icon size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{item.label}</div>
                    <div className="text-gray-500 text-xs">{item.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => item.set(!item.state)}
                  className={`w-12 h-7 rounded-full transition-all relative ${
                    item.state ? "bg-[#34d74a]" : "bg-[#333]"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all shadow-md ${
                    item.state ? "left-6" : "left-1"
                  }`}></div>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#34d74a] text-black font-bold uppercase tracking-widest px-8 py-3 rounded-xl hover:bg-[#2bc43f] transition-all shadow-[0_0_20px_rgba(52,215,74,0.2)] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : saved ? <Check size={18} /> : null}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>

        {/* Danger Zone */}
        <section className="bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-red-500/20 pb-4">
            <Shield className="text-red-500" size={20} />
            <h2 className="text-red-500 font-bold uppercase tracking-wider text-sm">Danger Zone</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#111] rounded-xl border border-[#262626]">
            <div>
              <div className="text-white font-medium text-sm">Sign Out</div>
              <div className="text-gray-500 text-xs">End your current authenticated session</div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#333] hover:border-gray-500 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#111] rounded-xl border border-red-500/10">
            <div>
              <div className="text-red-400 font-medium text-sm">Delete Account & Data</div>
              <div className="text-gray-500 text-xs">Permanently remove all portfolio data, transactions, and chat history</div>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 rounded-lg text-sm font-bold transition-all"
            >
              Delete Everything
            </button>
          </div>
        </section>

        {/* Footer Info */}
        <div className="text-center pt-4 border-t border-[#262626]">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">
            AXIS CAP Terminal v2.0 • Built with Next.js + Supabase + TradingView • Deployed on Vercel
          </p>
        </div>
      </div>
    </>
  );
}
