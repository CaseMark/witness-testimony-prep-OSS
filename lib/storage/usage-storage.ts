// localStorage-based usage tracking for demo limits
// Tracks token and OCR usage per session and per day

import { v4 as uuidv4 } from 'uuid';
import type { TokenUsage, OCRUsage, UsageStats } from '@/lib/types/demo-limits';
import { DEMO_LIMITS } from '@/lib/demo-limits/config';

const TOKEN_USAGE_KEY = 'wtp_token_usage_v1';
const OCR_USAGE_KEY = 'wtp_ocr_usage_v1';
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

// Check if daily reset is needed
function shouldResetDaily(resetAt: string): boolean {
  const resetDate = new Date(resetAt);
  const now = new Date();
  return now >= resetDate;
}

// Get next daily reset time (midnight local time)
function getNextDailyReset(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

// Token Usage Functions
export function getTokenUsage(): TokenUsage {
  if (!isBrowser()) {
    return createDefaultTokenUsage();
  }

  try {
    const stored = localStorage.getItem(TOKEN_USAGE_KEY);
    if (!stored) {
      const usage = createDefaultTokenUsage();
      saveTokenUsage(usage);
      return usage;
    }

    const usage = JSON.parse(stored) as TokenUsage;

    // Check if daily reset is needed
    if (shouldResetDaily(usage.dailyResetAt)) {
      usage.dailyTokens = 0;
      usage.dailyResetAt = getNextDailyReset();
      saveTokenUsage(usage);
    }

    // Check if this is a new session
    const currentSessionId = getSessionId();
    if (usage.sessionId !== currentSessionId) {
      usage.sessionId = currentSessionId;
      usage.sessionTokens = 0;
      saveTokenUsage(usage);
    }

    return usage;
  } catch (error) {
    console.error('Failed to load token usage:', error);
    return createDefaultTokenUsage();
  }
}

function createDefaultTokenUsage(): TokenUsage {
  return {
    userId: getUserId(),
    sessionId: getSessionId(),
    requestTokens: 0,
    sessionTokens: 0,
    dailyTokens: 0,
    lastRequestAt: new Date().toISOString(),
    dailyResetAt: getNextDailyReset(),
  };
}

function saveTokenUsage(usage: TokenUsage): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(TOKEN_USAGE_KEY, JSON.stringify(usage));
  } catch (error) {
    console.error('Failed to save token usage:', error);
  }
}

export function recordTokenUsage(tokens: number): TokenUsage {
  const usage = getTokenUsage();

  usage.requestTokens = tokens;
  usage.sessionTokens += tokens;
  usage.dailyTokens += tokens;
  usage.lastRequestAt = new Date().toISOString();

  saveTokenUsage(usage);
  return usage;
}

export function resetSessionTokens(): void {
  const usage = getTokenUsage();
  usage.sessionTokens = 0;
  usage.sessionId = getSessionId();
  saveTokenUsage(usage);
}

// OCR Usage Functions
export function getOCRUsage(): OCRUsage {
  if (!isBrowser()) {
    return createDefaultOCRUsage();
  }

  try {
    const stored = localStorage.getItem(OCR_USAGE_KEY);
    if (!stored) {
      const usage = createDefaultOCRUsage();
      saveOCRUsage(usage);
      return usage;
    }

    const usage = JSON.parse(stored) as OCRUsage;

    // Check if daily reset is needed
    if (shouldResetDaily(usage.dailyResetAt)) {
      usage.dailyPages = 0;
      usage.dailyResetAt = getNextDailyReset();
      saveOCRUsage(usage);
    }

    // Check if this is a new session
    const currentSessionId = getSessionId();
    if (usage.sessionId !== currentSessionId) {
      usage.sessionId = currentSessionId;
      usage.sessionDocuments = 0;
      usage.sessionPages = 0;
      saveOCRUsage(usage);
    }

    return usage;
  } catch (error) {
    console.error('Failed to load OCR usage:', error);
    return createDefaultOCRUsage();
  }
}

function createDefaultOCRUsage(): OCRUsage {
  return {
    userId: getUserId(),
    sessionId: getSessionId(),
    sessionDocuments: 0,
    sessionPages: 0,
    dailyPages: 0,
    dailyResetAt: getNextDailyReset(),
  };
}

function saveOCRUsage(usage: OCRUsage): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(OCR_USAGE_KEY, JSON.stringify(usage));
  } catch (error) {
    console.error('Failed to save OCR usage:', error);
  }
}

export function recordOCRUsage(documents: number, pages: number): OCRUsage {
  const usage = getOCRUsage();

  usage.sessionDocuments += documents;
  usage.sessionPages += pages;
  usage.dailyPages += pages;

  saveOCRUsage(usage);
  return usage;
}

export function resetSessionOCR(): void {
  const usage = getOCRUsage();
  usage.sessionDocuments = 0;
  usage.sessionPages = 0;
  usage.sessionId = getSessionId();
  saveOCRUsage(usage);
}

// Combined Usage Stats
export function getUsageStats(): UsageStats {
  const tokenUsage = getTokenUsage();
  const ocrUsage = getOCRUsage();
  const limits = DEMO_LIMITS;

  const tokenPercent = Math.max(
    (tokenUsage.sessionTokens / limits.tokens.perSession) * 100,
    (tokenUsage.dailyTokens / limits.tokens.perDayPerUser) * 100
  );

  const ocrPercent = Math.max(
    (ocrUsage.sessionDocuments / limits.ocr.maxDocumentsPerSession) * 100,
    (ocrUsage.dailyPages / limits.ocr.maxPagesPerDay) * 100
  );

  return {
    tokens: {
      sessionUsed: tokenUsage.sessionTokens,
      sessionLimit: limits.tokens.perSession,
      dailyUsed: tokenUsage.dailyTokens,
      dailyLimit: limits.tokens.perDayPerUser,
      percentUsed: Math.min(100, tokenPercent),
    },
    ocr: {
      documentsUsed: ocrUsage.sessionDocuments,
      documentsLimit: limits.ocr.maxDocumentsPerSession,
      pagesUsed: ocrUsage.sessionPages,
      dailyPagesUsed: ocrUsage.dailyPages,
      dailyPagesLimit: limits.ocr.maxPagesPerDay,
      percentUsed: Math.min(100, ocrPercent),
    },
  };
}

// Clear all usage data
export function clearAllUsage(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_USAGE_KEY);
  localStorage.removeItem(OCR_USAGE_KEY);
}
