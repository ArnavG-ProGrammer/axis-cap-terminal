"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Headset, User, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'ai'|'user', text: string}[]>([
    { role: 'ai', text: 'AXIS CAP Quantum LLM initialized. How can I assist your portfolio analysis or terminal logic today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCloudChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
         setUserId(session.user.id);
         try {
           const { data } = await supabase.from('user_chat_history').select('*').eq('user_id', session.user.id).order('created_at', { ascending: true });
           if (data && data.length > 0) {
             setMessages(data.map(d => ({ role: d.role, text: d.message })));
           }
         } catch (err) {
           console.log("Chat history table not instantiated yet, falling back to local memory.");
           const saved = localStorage.getItem('axis_ai_chat');
           if (saved) {
              try { setMessages(JSON.parse(saved)); } catch(e) {}
           }
         }
      }
    };
    fetchCloudChat();
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
       localStorage.setItem('axis_ai_chat', JSON.stringify(messages)); // Fallback mirror
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if(!input.trim()) return;
    const userMsg = input.trim();
    
    // Optimistic Update
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    if (userId) {
       try { await supabase.from('user_chat_history').insert({ user_id: userId, role: 'user', message: userMsg }); } 
       catch(e) { console.warn('Supabase DB error, skipping insert.'); }
    }

    // Simulate high-tier LLM response
    setTimeout(() => {
       setIsTyping(false);
       let aiResponse = "Processing generic execution inquiry. Please specify market tickers to drill down Gordon-Growth structural models.";
       
       if (userMsg.toLowerCase().match(/^(hi|hello|hey|greetings|morning)(?:\s.*)?$/)) {
          aiResponse = "Hello! I am AXIS AI, your institutional financial intelligence companion. I'm equipped to analyze real-time market data, aggregate macro news, run Discounted Cash Flow (DCF) variance models, and assist in dynamically configuring your portfolio. How can I help you extract alpha from the market today?";
       } else if (userMsg.toLowerCase().includes('groww') || userMsg.toLowerCase().includes('tradingview') || userMsg.toLowerCase().includes('transfer') || userMsg.toLowerCase().includes('csv')) {
          aiResponse = "To transfer portfolios from Retail/Broker apps like Groww or TradingView, export your historical trades as a standardized CSV file. Under 'Portfolio > Advanced Import', you can upload this CSV natively into the Supabase 'user_portfolios' relational table structurally.";
       } else if (userMsg.toLowerCase().includes('supabase') || userMsg.toLowerCase().includes('auth')) {
          aiResponse = "Supabase operates as our dedicated PostgreSQL backend. Your data is isolated via Row-Level Security (RLS), meaning neither other users nor internal processes can access your structural execution tables or simulation logic.";
       } else if (userMsg.toLowerCase().includes('ai insight') || userMsg.toLowerCase().includes('analysis')) {
          aiResponse = "The terminal's AI Insight logic works by calculating Discounted Cash Flow (DCF), running live Backtesting variance models, and injecting live Level-2 proxy execution arrays into a synthetic Beta analysis.";
       } else if (userMsg.toLowerCase().includes('yes bank')) {
          aiResponse = "YESBANK (NSE): Current volatility is compressing. Moving averages indicate a consolidation phase between ₹23.50 and ₹26.00. Institutional backing has stabilized its tier-1 capital constraints. I recommend reviewing our simulated DCF model and Backtesting portal by searching 'YESBANK' in the global search block to calculate exact projected Alpha.";
       } else {
          aiResponse = `Analyzing institutional logic for "${userMsg}". Currently calculating standard variance. For specific asset analysis, please use the Global Market Search bar to view individual DCF, backtesting, and full TradingView macro integration.`;
       }

       setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
       
       if (userId) {
          supabase.from('user_chat_history').insert({ user_id: userId, role: 'ai', message: aiResponse }).then();
       }

    }, 1800);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#111] hover:bg-[#34d74a] text-[#34d74a] hover:text-black border border-[#34d74a] p-4 rounded-full shadow-[0_0_20px_rgba(52,215,74,0.3)] transition-all group relative"
        >
           <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
           <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-black">1</span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[400px] h-[550px] bg-[#0a0a0a]/95 backdrop-blur-xl border border-[#262626] rounded-2xl shadow-2xl flex flex-col z-50 animate-fade-in overflow-hidden">
           
           <div className="bg-[#111] border-b border-[#262626] p-4 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#34d74a]/20 to-transparent blur-xl"></div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#34d74a] flex items-center justify-center">
                    <Headset size={16} className="text-[#34d74a]" />
                 </div>
                 <div>
                    <h3 className="text-white text-sm font-bold tracking-widest uppercase">Quantum LLM Oracle</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#34d74a] animate-pulse"></span>
                       <span className="text-[10px] text-gray-500 font-mono tracking-wider">NETWORK SECURE</span>
                    </div>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white p-1 transition-colors"><X size={18}/></button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((m, i) => (
                 <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl p-3 text-sm leading-relaxed shadow-lg ${
                       m.role === 'user' 
                         ? 'bg-[#1a1a1a] border border-[#333] text-gray-200 rounded-tr-sm' 
                         : 'bg-[#111] border border-[#262626] text-gray-300 rounded-tl-sm'
                    }`}>
                       {m.text}
                    </div>
                 </div>
              ))}
              {isTyping && (
                 <div className="flex justify-start">
                    <div className="bg-[#111] border border-[#262626] text-gray-400 rounded-xl rounded-tl-sm p-4 w-16 flex justify-center shadow-lg">
                       <Loader2 size={16} className="animate-spin text-[#34d74a]" />
                    </div>
                 </div>
              )}
              <div ref={endRef} />
           </div>

           <div className="p-4 bg-[#111] border-t border-[#262626]">
              <div className="relative">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask standard logic or Supabase questions..."
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white text-sm rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:border-[#34d74a] transition-all"
                 />
                 <button 
                    onClick={handleSend}
                    className="absolute right-2 top-2 bottom-2 bg-[#1a1a1a] hover:bg-[#34d74a] text-gray-400 hover:text-black w-8 rounded-md flex items-center justify-center transition-all"
                 >
                    <Send size={14} />
                 </button>
              </div>
              <div className="text-center mt-2">
                 <span className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">Simulated execution for Academic Environment</span>
              </div>
           </div>

        </div>
      )}
    </>
  );
}
