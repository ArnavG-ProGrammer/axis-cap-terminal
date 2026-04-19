"use client";

import React, { useEffect, useRef } from 'react';

interface Props {
  dataSource: "NSE" | "BSE";
  height?: string;
  width?: string;
}

const TradingViewHeatmapEmbed: React.FC<Props> = ({ dataSource, height = "100%", width = "100%" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing content
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      "exchanges": [dataSource],
      "dataSource": "all_stocks",
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
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [dataSource, height, width]);

  return (
    <div className="w-full h-full bg-[#0a0a0a]" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
};

export default TradingViewHeatmapEmbed;
