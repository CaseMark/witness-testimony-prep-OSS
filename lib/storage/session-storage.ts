// localStorage-based session storage for Testimony Prep Tool
// Replaces server-side in-memory storage with client-side persistence

import { v4 as uuidv4 } from 'uuid';
import type { PracticeSession, Document, CrossExamQuestion, PracticeExchange } from '@/lib/types/testimony';

const STORAGE_KEY = 'wtp_testimony_sessions_v1';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// SSR safety check
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function loadSessions(): Map<string, PracticeSession> {
  if (!isBrowser()) return new Map();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Map();

    const parsed = JSON.parse(stored) as Record<string, PracticeSession>;
    return new Map(Object.entries(parsed));
  } catch (error) {
    console.error('Failed to load sessions from localStorage:', error);
    return new Map();
  }
}

function saveSessions(sessions: Map<string, PracticeSession>): void {
  if (!isBrowser()) return;

  try {
    const obj = Object.fromEntries(sessions.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Failed to save sessions to localStorage:', error);
    // Handle quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Remove oldest sessions and retry
      cleanupOldSessions(sessions, true);
      try {
        const obj = Object.fromEntries(sessions.entries());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      } catch {
        console.error('Failed to save even after cleanup');
      }
    }
  }
}

function cleanupOldSessions(sessions: Map<string, PracticeSession>, aggressive = false): void {
  const now = Date.now();
  const ttl = aggressive ? SESSION_TTL_MS / 2 : SESSION_TTL_MS;

  for (const [id, session] of sessions.entries()) {
    const createdAt = new Date(session.createdAt).getTime();
    if (now - createdAt > ttl) {
      sessions.delete(id);
    }
  }
}

export function createSession(witnessName: string, caseName: string): PracticeSession {
  const sessions = loadSessions();
  cleanupOldSessions(sessions);

  const session: PracticeSession = {
    id: uuidv4(),
    witnessName,
    caseName,
    createdAt: new Date().toISOString(),
    documents: [],
    questions: [],
    status: 'setup',
    practiceHistory: [],
    totalDuration: 0,
  };

  sessions.set(session.id, session);
  saveSessions(sessions);
  return session;
}

export function getSession(sessionId: string): PracticeSession | undefined {
  const sessions = loadSessions();
  return sessions.get(sessionId);
}

export function getAllSessions(): PracticeSession[] {
  const sessions = loadSessions();
  return Array.from(sessions.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateSession(sessionId: string, updates: Partial<PracticeSession>): PracticeSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const updated = { ...session, ...updates };
  sessions.set(sessionId, updated);
  saveSessions(sessions);
  return updated;
}

export function addDocument(sessionId: string, document: Document): PracticeSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.documents.push(document);
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function updateDocument(sessionId: string, documentId: string, updates: Partial<Document>): PracticeSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const docIndex = session.documents.findIndex(d => d.id === documentId);
  if (docIndex === -1) return undefined;

  session.documents[docIndex] = { ...session.documents[docIndex], ...updates };
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function removeDocument(sessionId: string, documentId: string): PracticeSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.documents = session.documents.filter(d => d.id !== documentId);
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function setQuestions(sessionId: string, questions: CrossExamQuestion[]): PracticeSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.questions = questions;
  session.status = 'ready';
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function addPracticeExchange(sessionId: string, exchange: PracticeExchange): PracticeSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.practiceHistory.push(exchange);
  session.totalDuration += exchange.duration;
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function deleteSession(sessionId: string): boolean {
  const sessions = loadSessions();
  const deleted = sessions.delete(sessionId);
  if (deleted) {
    saveSessions(sessions);
  }
  return deleted;
}

export function clearAllSessions(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}

// Get storage usage stats
export function getStorageStats(): { used: number; available: number; sessionCount: number } {
  if (!isBrowser()) return { used: 0, available: 5 * 1024 * 1024, sessionCount: 0 };

  const stored = localStorage.getItem(STORAGE_KEY) || '';
  const used = new Blob([stored]).size;
  const sessions = loadSessions();

  return {
    used,
    available: 5 * 1024 * 1024, // Approximate localStorage limit
    sessionCount: sessions.size,
  };
}
