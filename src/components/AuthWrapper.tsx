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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showTcs, setShowTcs] = useState(false);

  useEffect(() => {
    // Strict Global Auth Enforcement
    const PUBLIC_ROUTES = ['/', '/login', '/privacy', '/terms', '/about'];
    if (isAuthenticated === false && !PUBLIC_ROUTES.includes(pathname)) {
       router.push('/login');
    } else if (isAuthenticated === true && (pathname === '/login' || pathname === '/')) {
       router.push('/dashboard');
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

  // Don't render protected branches until auth state resolves to prevent flashes
  const PUBLIC_ROUTES = ['/', '/login', '/privacy', '/terms', '/about'];
  if (isAuthenticated === null && !PUBLIC_ROUTES.includes(pathname)) {
    return <div className="h-screen w-screen bg-[#000000]" />; 
  }

  // Prevent flash of landing page while redirecting authenticated users
  if (isAuthenticated === true && (pathname === '/' || pathname === '/login')) {
    return <div className="h-screen w-screen bg-[#000000]" />;
  }

  // Pure isolated view for Public Pages (Login, Privacy, Terms, About, and Landing)
  if (PUBLIC_ROUTES.includes(pathname)) {
     return <>{children}</>;
  }

  // Institutional Authenticated View
  return (
    <div className="flex bg-[#000000] min-h-screen selection:bg-[#34d74a]/30">
      {showTcs && <TermsModal onAccept={() => setShowTcs(false)} />}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className={`flex-1 flex flex-col ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'} relative bg-[#000000] w-full max-w-[100vw] transition-all duration-300`}>
        <TopNav onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
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
