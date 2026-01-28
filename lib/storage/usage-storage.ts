// localStorage-based usage tracking (simplified for OSS version - no limits)

import { v4 as uuidv4 } from 'uuid';

const STATS_KEY = 'wtp_session_stats_v2';
const USER_ID_KEY = 'wtp_user_id_v1';
const SESSION_ID_KEY = 'wtp_session_id_v1';

// SSR safety check
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// Get or create anonymous user ID (persists across sessions)
export function getUserId(): string {
  if (!isBrowser()) return 'server';

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${uuidv4()}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

// Get or create session ID (new per browser session)
export function getSessionId(): string {
  if (!isBrowser()) return 'server';

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `session_${uuidv4()}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Format price for display
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

// Calculate cost (always returns 0 in OSS version)
export function calculateCost(_charCount: number): number {
  return 0;
}
