import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory store for rate limiting. 
// Note: In Serverless environments, this resets per isolate, but provides basic brute-force protection.
const rateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();
const MAX_REQUESTS = 5; // 5 attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function middleware(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const path = req.nextUrl.pathname;

  // Only apply rate limiting to auth and protected endpoints
  if (path.startsWith('/api/ai-analysis') || path.startsWith('/api/quote') || path === '/login') {
    // Specifically limit POST requests for brute force protection
    if (req.method === 'POST') {
      const now = Date.now();
      const record = rateLimitMap.get(ip);

      if (!record) {
        rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
      } else {
        if (now - record.firstRequestTime > WINDOW_MS) {
          // Reset window
          rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
        } else {
          record.count++;
          if (record.count > MAX_REQUESTS) {
            console.warn(`Rate limit exceeded for IP: ${ip} on path: ${path}`);
            return new NextResponse(
              JSON.stringify({ error: 'Too many requests. Please try again in 15 minutes.' }),
              { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }
  }

  // Add security headers globally
  const res = NextResponse.next();
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return res;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/login'
  ]
};
