// Core types for Testimony Prep Tool

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string; // ISO string for localStorage serialization
  objectId?: string;
  content?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  pageCount?: number; // For OCR tracking
}

export interface CrossExamQuestion {
  id: string;
  question: string;
  category: 'timeline' | 'credibility' | 'inconsistency' | 'foundation' | 'impeachment' | 'general';
  difficulty: 'easy' | 'medium' | 'hard';
  suggestedApproach?: string;
  weakPoint?: string;
  followUpQuestions?: string[];
  documentReference?: string;
}

export interface PracticeSession {
  id: string;
  witnessName: string;
  caseName: string;
  createdAt: string; // ISO string for localStorage serialization
  documents: Document[];
  questions: CrossExamQuestion[];
  status: 'setup' | 'generating' | 'ready' | 'practicing' | 'completed';
  practiceHistory: PracticeExchange[];
  totalDuration: number;
  recordingUrl?: string;
}

export interface PracticeExchange {
  id: string;
  questionId: string;
  question: string;
  witnessResponse: string;
  aiFollowUp?: string;
  feedback?: string;
  timestamp: string; // ISO string for localStorage serialization
  duration: number;
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  audioUrl?: string;
  transcription?: string;
  status: 'recording' | 'processing' | 'completed' | 'error';
  startedAt: string; // ISO string for localStorage serialization
  endedAt?: string; // ISO string for localStorage serialization
}

export interface QuestionGenerationRequest {
  documents: { name: string; content: string }[];
  witnessName: string;
  caseName: string;
  witnessRole?: string;
  focusAreas?: string[];
}

export interface AIExaminerResponse {
  followUp?: string;
  feedback?: string;
  weaknessIdentified?: string;
  suggestedImprovement?: string;
}

// Question category display metadata
export const QUESTION_CATEGORIES: Record<CrossExamQuestion['category'], { label: string; color: string }> = {
  timeline: { label: 'Timeline', color: 'blue' },
  credibility: { label: 'Credibility', color: 'red' },
  inconsistency: { label: 'Inconsistency', color: 'amber' },
  foundation: { label: 'Foundation', color: 'purple' },
  impeachment: { label: 'Impeachment', color: 'rose' },
  general: { label: 'General', color: 'gray' },
};

export const DIFFICULTY_LEVELS: Record<CrossExamQuestion['difficulty'], { label: string; color: string }> = {
  easy: { label: 'Easy', color: 'green' },
  medium: { label: 'Medium', color: 'amber' },
  hard: { label: 'Hard', color: 'red' },
};
