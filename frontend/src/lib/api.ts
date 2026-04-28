import { createClient } from '@metagptx/web-sdk';

// Create client instance
export const client = createClient();

/**
 * Wrap an async API call with retry logic for transient backend/network errors
 * (e.g. DNS resolver timeouts, 502/503, cold-start lambda errors).
 *
 * @param fn The async function to execute
 * @param retries Number of retries (default 2)
 * @param delayMs Base delay between retries in ms (default 600)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 600
): Promise<T> {
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const msg = (err?.message || '').toString().toLowerCase();
      const status = err?.status || err?.response?.status;
      const isTransient =
        msg.includes('timeout') ||
        msg.includes('dns') ||
        msg.includes('resolve') ||
        msg.includes('network') ||
        msg.includes('failed to fetch') ||
        msg.includes('lock') ||
        status === 502 ||
        status === 503 ||
        status === 504;

      if (!isTransient || attempt === retries) {
        throw err;
      }
      // Exponential backoff
      await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
    }
  }
  throw lastErr;
}