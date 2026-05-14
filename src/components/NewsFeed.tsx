"use client";

import React, { useState, useEffect } from 'react';
import { Newspaper, Loader2, ArrowUpRight, Clock } from 'lucide-react';

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
}

export default function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(20);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchNews = async () => {
    try {
      // The API route already aggregates up to 100 items from Yahoo and RSS
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.news) {
        setNews(data.news);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('Failed to fetch news', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 20, news.length, 60));
  };

  const timeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden flex flex-col h-[600px]">
      <div className="px-5 py-3 bg-[#111] border-b border-[#262626] flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#34d74a] animate-pulse"></div>
          <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
            <Newspaper size={16}/> Live Institutional Feed
          </h3>
        </div>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
          <Clock size={12}/> Updated {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
        {loading && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm font-medium">Aggregating global feeds...</span>
          </div>
        ) : news.length === 0 ? (
          <div className="p-5 text-center text-gray-500 text-sm">Data unavailable.</div>
        ) : (
          <div className="flex flex-col divide-y divide-[#1a1a1a]">
            {news.slice(0, displayCount).map((item, idx) => (
              <a 
                key={idx} 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-4 hover:bg-[#111] transition-colors flex flex-col gap-2"
              >
                <div className="flex justify-between items-start gap-4">
                  <h4 className="text-sm font-medium text-gray-200 group-hover:text-[#34d74a] transition-colors leading-snug">
                    {item.title}
                  </h4>
                  <ArrowUpRight size={14} className="text-gray-600 group-hover:text-[#34d74a] shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1 font-mono">
                  <span className="truncate max-w-[60%] text-[#d79734] uppercase tracking-wider">{item.publisher}</span>
                  <span>{timeAgo(item.publishedAt)}</span>
                </div>
              </a>
            ))}
            
            {displayCount < Math.min(news.length, 60) && (
              <div className="p-4 flex justify-center">
                <button 
                  onClick={loadMore}
                  className="bg-[#111] border border-[#262626] text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-md transition-colors hover:border-[#34d74a]"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
