"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type CurrencyContextType = {
  currency: string;
  setCurrency: (c: string) => void;
  currencySymbol: string;
  multiplier: number;
  liveRates: Record<string, { symbol: string; rate: number }>;
  getNativeCurrency: (symbol: string) => string;
  getConvertedPrice: (price: number, symbol: string) => number;
};

const fxRates: Record<string, { symbol: string; rate: number }> = {
  USD: { symbol: "$", rate: 1 },
  EUR: { symbol: "€", rate: 0.92 },
  INR: { symbol: "₹", rate: 92.37 },
  GBP: { symbol: "£", rate: 0.79 },
  JPY: { symbol: "¥", rate: 151.2 },
  CAD: { symbol: "C$", rate: 1.35 },
};

const getNativeCurrencyFunc = (symbol: string) => {
  if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) return 'INR';
  if (symbol.endsWith('.L')) return 'GBP';
  if (symbol.endsWith('.T')) return 'JPY';
  if (symbol.endsWith('.TO')) return 'CAD';
  return 'USD';
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  currencySymbol: "$",
  multiplier: 1,
  liveRates: fxRates,
  getNativeCurrency: getNativeCurrencyFunc,
  getConvertedPrice: (price: number) => price,
});

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrencyState] = useState("USD");
  const [liveRates, setLiveRates] = useState(fxRates);

  useEffect(() => {
    const saved = localStorage.getItem("axis_currency");
    if (saved && fxRates[saved]) setCurrencyState(saved);
    
    // Live Dynamic Sync
    const hydrateRates = async () => {
      const symbols = [
        { key: 'INR', sym: 'USDINR=X' },
        { key: 'EUR', sym: 'USDEUR=X' },
        { key: 'GBP', sym: 'USDGBP=X' },
        { key: 'JPY', sym: 'USDJPY=X' },
        { key: 'CAD', sym: 'USDCAD=X' },
      ];
      const newRates = { ...fxRates };
      await Promise.all(symbols.map(async ({ key, sym }) => {
         try {
           const res = await fetch(`/api/quote?q=${sym}`);
           const data = await res.json();
           if (data.price) newRates[key] = { ...newRates[key], rate: data.price };
         } catch(e) {}
      }));
      setLiveRates(newRates);
    };
    
    hydrateRates();
  }, []);

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem("axis_currency", c);
    window.dispatchEvent(new Event("currencyChange")); // simple global event
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencySymbol: liveRates[currency]?.symbol || "$",
        multiplier: liveRates[currency]?.rate || 1,
        liveRates,
        getNativeCurrency: getNativeCurrencyFunc,
        getConvertedPrice: (price: number, symbol: string) => {
           const nativeCur = getNativeCurrencyFunc(symbol);
           const nativeRate = liveRates[nativeCur]?.rate || 1;
           const valInUsd = price / nativeRate;
           return valInUsd * (liveRates[currency]?.rate || 1);
        },
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
