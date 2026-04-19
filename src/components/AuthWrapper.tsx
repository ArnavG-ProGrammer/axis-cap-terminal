"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import AIChatWidget from "@/components/AIChatWidget";
import TermsModal from "@/components/TermsModal";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTcs, setShowTcs] = useState(false);

  useEffect(() => {
    if (isAuthenticated === false && pathname !== '/login') {
       router.push('/login');
    } else if (isAuthenticated === true && pathname === '/login') {
       router.push('/');
    }

    // Evaluate Terms of Service visibility state upon auth confirming
    if (isAuthenticated && user) {
       const userAcceptedTcs = user.user_metadata?.tcs_accepted;
       const localAcceptedTcs = localStorage.getItem('axis_tcs_accepted');
       
       if (!userAcceptedTcs && localAcceptedTcs !== 'true') {
         setShowTcs(true);
       }
    }
  }, [isAuthenticated, pathname, router, user]);

  // Don't render protected branches until auth state resolves
  if (isAuthenticated === null && pathname !== '/login') {
    return <div className="h-screen w-screen bg-[#000000]" />; // Render black screen to prevent layout flash
  }

  // Pure isolated view for Login page
  if (pathname === '/login') {
     return <>{children}</>;
  }

  // Institutional Authenticated View
  return (
    <div className="flex bg-[#000000] min-h-screen selection:bg-[#34d74a]/30">
      {showTcs && <TermsModal onAccept={() => setShowTcs(false)} />}
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col lg:ml-64 relative bg-[#000000] w-full max-w-[100vw]">
        <TopNav onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto mt-16 p-4 sm:p-6 lg:p-10 relative" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="max-w-[1600px] mx-auto relative z-10 w-full">
            {children}
          </div>
        </main>
      </div>
      <AIChatWidget />
    </div>
  );
}
