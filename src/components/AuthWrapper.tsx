"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import AIChatWidget from "@/components/AIChatWidget";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated === false && pathname !== '/login') {
       router.push('/login');
    } else if (isAuthenticated === true && pathname === '/login') {
       router.push('/');
    }
  }, [isAuthenticated, pathname, router]);

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
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 relative bg-[#000000]">
        <TopNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto mt-16 p-6 sm:p-10 relative">
          <div className="max-w-[1600px] mx-auto relative z-10 w-full">
            {children}
          </div>
        </main>
      </div>
      <AIChatWidget />
    </div>
  );
}
