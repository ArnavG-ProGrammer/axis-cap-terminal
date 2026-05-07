"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Lightweight mocked analytics tracker for page views and custom events
function AnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      // In a real environment, this would fire to Google Analytics, Vercel Analytics, or Plausible
      const url = pathname + searchParams.toString();
      console.log(`[Analytics] PageView Tracked: ${url}`);
      
      // Example implementation for a future data layer:
      // window.dataLayer = window.dataLayer || [];
      // window.dataLayer.push({ event: 'pageview', page: url });
    }
  }, [pathname, searchParams]);

  return null; // This component is strictly logical and has no UI
}

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsInner />
    </Suspense>
  );
}
