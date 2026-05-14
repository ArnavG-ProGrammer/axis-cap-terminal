"use client";

import { useState } from "react";
import { MessageSquareWarning, X } from "lucide-react";

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    
    setStatus("sending");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subject: "Support Request from Dashboard", message })
      });
      if (res.ok) {
        setStatus("sent");
        setTimeout(() => { setIsOpen(false); setStatus("idle"); setMessage(""); }, 2000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#34d74a] hover:bg-[#2bc43f] text-black p-3 md:px-5 md:py-3 rounded-full shadow-[0_0_20px_rgba(52,215,74,0.3)] transition-all flex items-center gap-2 group"
        title="Report Bug / Contact Support"
      >
        <MessageSquareWarning size={20} />
        <span className="hidden md:inline font-bold uppercase tracking-wider text-xs">Support</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-[#111] border border-[#262626] p-6 rounded-2xl w-full max-w-md relative shadow-2xl">
             <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
             <h2 className="text-xl font-bold text-white mb-2">Contact Support</h2>
             <p className="text-sm text-gray-400 mb-6">Encountered an issue or need quantitative assistance? Send us a message.</p>
             
             {status === "sent" ? (
               <div className="bg-[#34d74a]/10 border border-[#34d74a] text-[#34d74a] p-4 rounded-lg font-bold text-center">Message Sent Successfully!</div>
             ) : (
               <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                 <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Your Email Address" className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#34d74a]" />
                 <textarea value={message} onChange={e => setMessage(e.target.value)} required placeholder="Describe your issue or feedback..." rows={4} className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#34d74a]" />
                 <button type="submit" disabled={status === "sending"} className="w-full bg-[#34d74a] text-black font-bold py-3 rounded-lg hover:bg-[#2bc43f] transition-colors disabled:opacity-50">
                   {status === "sending" ? "Sending..." : "Submit Ticket"}
                 </button>
                 {status === "error" && <p className="text-red-500 text-xs text-center">Failed to send message. Please try again.</p>}
               </form>
             )}
           </div>
        </div>
      )}
    </>
  );
}
