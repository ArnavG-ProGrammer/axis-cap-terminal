"use client";

import { MessageSquareWarning } from "lucide-react";

export default function FeedbackWidget() {
  const handleFeedback = () => {
    // Basic mailto link for bug reports / support
    const email = "arnavsgoyal@gmail.com";
    const subject = "Bug Report / Support Request - AXIS CAP";
    const body = "Please describe the issue or feedback you have:\n\n\n\n--- \nDiagnostics (Leave intact):\nURL: " + window.location.href + "\nUA: " + navigator.userAgent;
    
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <button 
      onClick={handleFeedback}
      className="fixed bottom-6 right-6 z-40 bg-[#34d74a] hover:bg-[#2bc43f] text-black p-3 md:px-5 md:py-3 rounded-full shadow-[0_0_20px_rgba(52,215,74,0.3)] transition-all flex items-center gap-2 group"
      title="Report Bug / Contact Support"
    >
      <MessageSquareWarning size={20} />
      <span className="hidden md:inline font-bold uppercase tracking-wider text-xs">Support</span>
    </button>
  );
}
