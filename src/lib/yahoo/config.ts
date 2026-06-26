export const CACHE_CONFIG = {
  // Configurable TTLs in seconds
  TTL_QUOTE: 60, // 60 seconds for live prices
  TTL_PROFILE: 86400, // 24 hours for fundamentals/financials
  TTL_SEARCH: 300, // 5 minutes for search results
  TTL_STALE_BACKUP: 86400 * 3, // Keep stale backups for 3 days to survive long weekends
  
  // Resiliency
  FETCH_TIMEOUT_MS: 5000,
  MAX_RETRIES: 2,
  MAX_CONCURRENT_YAHOO_REQUESTS: 10,
};
