"use client";

import React from "react";
import Head from "next/head";
import { Calendar } from "lucide-react";
import dynamic from "next/dynamic";

const EconomicCalendarWidget = dynamic(
  () => import("react-ts-tradingview-widgets").then((mod) => mod.EconomicCalendar),
  { ssr: false }
);

export default function CalendarPage() {
  return (
    <>
      <Head>
        <title>Economic Calendar | AXIS CAP</title>
      </Head>

      <div className="max-w-7xl mx-auto pb-20 space-y-6">
        <div className="flex items-center justify-between mb-4 border-b border-[#262626] pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Calendar className="text-[#34d74a]" size={28} /> Economic Calendar
            </h1>
            <p className="text-gray-400 mt-1">Track Fed meetings, GDP releases, CPI data, earnings dates, and central bank decisions globally.</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden shadow-2xl h-[800px]">
          <EconomicCalendarWidget colorTheme="dark" height="100%" width="100%" />
        </div>
      </div>
    </>
  );
}
