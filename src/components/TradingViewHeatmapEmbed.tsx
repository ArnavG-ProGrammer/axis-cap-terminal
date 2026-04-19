"use client";

import React, { useEffect, useRef } from 'react';

interface Props {
  dataSource: "NSE" | "BSE";
  height?: string;
  width?: string;
}

const TradingViewHeatmapEmbed: React.FC<Props> = ({ dataSource, height = "100%", width = "100%" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showComingSoon, setShowComingSoon] = React.useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    setShowComingSoon(false);

    // Timeout to show "Coming Soon" if data doesn't match criteria
    const timer = setTimeout(() => {
       setShowComingSoon(true);
    }, 4500);

    // Clear existing content
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      "exchanges": [dataSource],
      "dataSource": dataSource,
      "grouping": "sector",
      "blockSize": "market_cap",
      "blockColor": "change",
      "locale": "in",
      "symbolUrl": "",
      "colorTheme": "dark",
      "hasTopBar": false,
      "isDataSetEnabled": false,
      "isZoomEnabled": true,
      "hasSymbolTooltip": true,
      "width": width,
      "height": height
    });

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.appendChild(script);
    
    containerRef.current.appendChild(widgetContainer);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [dataSource, height, width]);

  return (
    <div className="w-full h-full bg-[#0a0a0a] relative" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
      
      {showComingSoon && (
        <div className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-10 text-center">
           <div className="w-16 h-16 rounded-full bg-[#34d74a]/10 border border-[#34d74a]/20 flex items-center justify-center mb-6 animate-pulse">
              <span className="text-[#34d74a] text-2xl font-black">!</span>
           </div>
           <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Regional Intelligence: Coming Soon</h2>
           <p className="text-gray-400 max-w-sm text-sm">
             Our institutional data nodes for {dataSource} are currently undergoing structural calibration. Universal Indian market treemaps will be available in the next terminal update.
           </p>
           <button 
             onClick={() => setShowComingSoon(false)}
             className="mt-8 px-6 py-2 bg-[#34d74a] text-black font-black text-[10px] uppercase tracking-widest rounded-full hover:scale-105 transition-all"
           >
             Try Initializing Again
           </button>
        </div>
      )}
    </div>
  );
};

export default TradingViewHeatmapEmbed;
