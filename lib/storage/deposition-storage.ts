// localStorage-based session storage for Deposition Prep Tool
// Replaces server-side in-memory storage with client-side persistence

import { v4 as uuidv4 } from 'uuid';
import type {
  DepositionSession,
  DepositionDocument,
  DepositionQuestion,
  TestimonyGap,
  Contradiction,
  DepositionOutline,
  OutlineSection
} from '@/lib/types/deposition';

const STORAGE_KEY = 'wtp_deposition_sessions_v1';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// SSR safety check
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function loadSessions(): Map<string, DepositionSession> {
  if (!isBrowser()) return new Map();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Map();

    const parsed = JSON.parse(stored) as Record<string, DepositionSession>;
    return new Map(Object.entries(parsed));
  } catch (error) {
    console.error('Failed to load deposition sessions from localStorage:', error);
    return new Map();
  }
}

function saveSessions(sessions: Map<string, DepositionSession>): void {
  if (!isBrowser()) return;

  try {
    const obj = Object.fromEntries(sessions.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Failed to save deposition sessions to localStorage:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
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

function cleanupOldSessions(sessions: Map<string, DepositionSession>, aggressive = false): void {
  const now = Date.now();
  const ttl = aggressive ? SESSION_TTL_MS / 2 : SESSION_TTL_MS;

  for (const [id, session] of sessions.entries()) {
    const createdAt = new Date(session.createdAt).getTime();
    if (now - createdAt > ttl) {
      sessions.delete(id);
    }
  }
}

export function createDepositionSession(
  deponentName: string,
  caseName: string,
  caseNumber?: string
): DepositionSession {
  const sessions = loadSessions();
  cleanupOldSessions(sessions);

  const session: DepositionSession = {
    id: uuidv4(),
    deponentName,
    caseName,
    caseNumber,
    createdAt: new Date().toISOString(),
    documents: [],
    gaps: [],
    contradictions: [],
    questions: [],
    outline: null,
    status: 'setup',
  };

  sessions.set(session.id, session);
  saveSessions(sessions);
  return session;
}

export function getDepositionSession(sessionId: string): DepositionSession | undefined {
  const sessions = loadSessions();
  return sessions.get(sessionId);
}

export function getAllDepositionSessions(): DepositionSession[] {
  const sessions = loadSessions();
  return Array.from(sessions.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateDepositionSession(
  sessionId: string,
  updates: Partial<DepositionSession>
): DepositionSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const updated = { ...session, ...updates };
  sessions.set(sessionId, updated);
  saveSessions(sessions);
  return updated;
}

export function addDepositionDocument(
  sessionId: string,
  document: DepositionDocument
): DepositionSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.documents.push(document);
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function updateDepositionDocument(
  sessionId: string,
  documentId: string,
  updates: Partial<DepositionDocument>
): DepositionSession | undefined {
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

export function removeDepositionDocument(
  sessionId: string,
  documentId: string
): DepositionSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.documents = session.documents.filter(d => d.id !== documentId);
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function setDepositionQuestions(
  sessionId: string,
  questions: DepositionQuestion[]
): DepositionSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.questions = questions;
  session.status = 'ready';
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function setAnalysisResults(
  sessionId: string,
  gaps: TestimonyGap[],
  contradictions: Contradiction[],
  analysis: DepositionSession['analysis']
): DepositionSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.gaps = gaps;
  session.contradictions = contradictions;
  session.analysis = analysis;
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function createOutline(sessionId: string, title: string): DepositionSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const outline: DepositionOutline = {
    id: uuidv4(),
    title,
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  session.outline = outline;
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function addOutlineSection(
  sessionId: string,
  section: Omit<OutlineSection, 'id'>
): DepositionSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session || !session.outline) return undefined;

  const newSection: OutlineSection = {
    ...section,
    id: uuidv4(),
  };

  session.outline.sections.push(newSection);
  session.outline.updatedAt = new Date().toISOString();
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function updateOutlineSection(
  sessionId: string,
  sectionId: string,
  updates: Partial<OutlineSection>
): DepositionSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session || !session.outline) return undefined;

  const sectionIndex = session.outline.sections.findIndex(s => s.id === sectionId);
  if (sectionIndex === -1) return undefined;

  session.outline.sections[sectionIndex] = {
    ...session.outline.sections[sectionIndex],
    ...updates
  };
  session.outline.updatedAt = new Date().toISOString();
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function reorderOutlineSections(
  sessionId: string,
  sectionIds: string[]
): DepositionSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session || !session.outline) return undefined;

  const reorderedSections: OutlineSection[] = [];
  for (let i = 0; i < sectionIds.length; i++) {
    const section = session.outline.sections.find(s => s.id === sectionIds[i]);
    if (section) {
      reorderedSections.push({ ...section, order: i });
    }
  }

  session.outline.sections = reorderedSections;
  session.outline.updatedAt = new Date().toISOString();
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function addQuestionToSection(
  sessionId: string,
  sectionId: string,
  question: DepositionQuestion
): DepositionSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session || !session.outline) return undefined;

  const sectionIndex = session.outline.sections.findIndex(s => s.id === sectionId);
  if (sectionIndex === -1) return undefined;

  session.outline.sections[sectionIndex].questions.push(question);
  session.outline.updatedAt = new Date().toISOString();
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function removeQuestionFromSection(
  sessionId: string,
  sectionId: string,
  questionId: string
): DepositionSession | undefined {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  if (!session || !session.outline) return undefined;

  const sectionIndex = session.outline.sections.findIndex(s => s.id === sectionId);
  if (sectionIndex === -1) return undefined;

  session.outline.sections[sectionIndex].questions =
    session.outline.sections[sectionIndex].questions.filter(q => q.id !== questionId);
  session.outline.updatedAt = new Date().toISOString();
  sessions.set(sessionId, session);
  saveSessions(sessions);
  return session;
}

export function deleteDepositionSession(sessionId: string): boolean {
  const sessions = loadSessions();
  const deleted = sessions.delete(sessionId);
  if (deleted) {
    saveSessions(sessions);
  }
  return deleted;
}

export function clearAllDepositionSessions(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getDepositionStorageStats(): { used: number; available: number; sessionCount: number } {
  if (typeof window === 'undefined') return { used: 0, available: 5 * 1024 * 1024, sessionCount: 0 };

  const stored = localStorage.getItem(STORAGE_KEY) || '';
  const used = new Blob([stored]).size;
  const sessions = loadSessions();

  return {
    used,
    available: 5 * 1024 * 1024,
    sessionCount: sessions.size,
  };
}
