import { Redis } from '@upstash/redis';
import { CACHE_CONFIG } from './config';

// 1. Initialize Redis or fallback to In-Memory Map
let redis: Redis | null = null;
const memoryCache = new Map<string, { value: any, expiresAt: number }>();

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (e) {
    console.warn("Failed to initialize Upstash Redis, falling back to in-memory cache", e);
  }
} else {
  console.warn("UPSTASH_REDIS_REST_URL or TOKEN missing, falling back to in-memory cache");
}

// Simple Cache Abstraction
async function getCache(key: string): Promise<any | null> {
  if (redis) {
    try {
      return await redis.get(key);
    } catch (e) {
      console.error(`Redis GET error for ${key}:`, e);
      return null;
    }
  } else {
    const item = memoryCache.get(key);
    if (item && item.expiresAt > Date.now()) {
      return item.value;
    }
    if (item && item.expiresAt <= Date.now()) {
      memoryCache.delete(key);
    }
    return null;
  }
}

async function setCache(key: string, value: any, ttlSeconds: number): Promise<void> {
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch (e) {
      console.error(`Redis SET error for ${key}:`, e);
    }
  } else {
    memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

// 2. Request Coalescing
const inFlight = new Map<string, Promise<any>>();

// 3. Concurrency Semaphore
class Semaphore {
  private tasks: (() => void)[] = [];
  private active = 0;
  constructor(private max: number) {}
  async acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active++;
      return;
    }
    return new Promise(resolve => this.tasks.push(resolve));
  }
  release() {
    this.active--;
    if (this.tasks.length > 0) {
      this.active++;
      const next = this.tasks.shift();
      if (next) next();
    }
  }
}
const outboundSemaphore = new Semaphore(CACHE_CONFIG.MAX_CONCURRENT_YAHOO_REQUESTS);

// Timeout Wrapper
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

/**
 * Resilient Cache Wrapper for Yahoo Finance
 */
export async function cachedYahooFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Coalescing: If already fetching, wait for it.
  if (inFlight.has(key)) {
    return inFlight.get(key) as Promise<T>;
  }

  const promise = (async () => {
    // 1. Check Fresh Cache
    const freshData = await getCache(key);
    if (freshData !== null) {
      return freshData as T;
    }

    // 2. We need to fetch. Try up to MAX_RETRIES times.
    let fetchError: any;
    for (let attempt = 1; attempt <= CACHE_CONFIG.MAX_RETRIES; attempt++) {
      await outboundSemaphore.acquire();
      try {
        const data = await withTimeout(fetcher(), CACHE_CONFIG.FETCH_TIMEOUT_MS);
        
        // 3. Success! Save to Fresh Cache and Stale Backup
        await setCache(key, data, ttlSeconds);
        // Save the stale backup using a 'stale:' prefix
        await setCache(`stale:${key}`, { data, asOf: Date.now() }, CACHE_CONFIG.TTL_STALE_BACKUP);
        
        return data;
      } catch (e) {
        fetchError = e;
        // Small backoff before retry
        if (attempt < CACHE_CONFIG.MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 500 * attempt));
        }
      } finally {
        outboundSemaphore.release();
      }
    }

    // 4. Fetch Failed. Look for Stale Backup
    console.error(`Yahoo fetch failed for ${key} after ${CACHE_CONFIG.MAX_RETRIES} attempts. Error:`, fetchError?.message || fetchError);
    const staleBackup = await getCache(`stale:${key}`);
    
    if (staleBackup && staleBackup.data) {
      console.warn(`Serving STALE data for ${key} (As of: ${new Date(staleBackup.asOf).toISOString()})`);
      const { data, asOf } = staleBackup;
      
      // Attempt to attach stale indicators seamlessly
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        (data as any).stale = true;
        (data as any).asOf = asOf;
      }
      return data as T;
    }

    // 5. Total Failure (No cache, no stale backup)
    throw fetchError || new Error(`Failed to fetch ${key}`);
  })();

  // Register in-flight
  inFlight.set(key, promise);
  
  try {
    return await promise;
  } finally {
    // Clean up in-flight
    inFlight.delete(key);
  }
}
