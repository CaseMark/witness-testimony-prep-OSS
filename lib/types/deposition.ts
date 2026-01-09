// Core types for Deposition Prep Tool
// For opposing counsel to prepare deposition questions

export interface DepositionDocument {
  id: string;
  name: string;
  type: 'prior_testimony' | 'exhibit' | 'transcript' | 'case_file' | 'other';
  fileType: string;
  size: number;
  uploadedAt: string; // ISO string for localStorage serialization
  objectId?: string;
  content?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  pageCount?: number; // For OCR tracking
  metadata?: {
    witness?: string;
    date?: string;
    pageCount?: number;
    source?: string;
  };
}

export interface TestimonyGap {
  id: string;
  description: string;
  documentReferences: string[];
  severity: 'minor' | 'moderate' | 'significant';
  suggestedQuestions: string[];
}

export interface Contradiction {
  id: string;
  description: string;
  source1: {
    document: string;
    excerpt: string;
    page?: string;
  };
  source2: {
    document: string;
    excerpt: string;
    page?: string;
  };
  severity: 'minor' | 'moderate' | 'significant';
  suggestedQuestions: string[];
}

export interface DepositionQuestion {
  id: string;
  question: string;
  topic: string;
  category: 'gap' | 'contradiction' | 'timeline' | 'foundation' | 'impeachment' | 'follow_up' | 'general';
  priority: 'high' | 'medium' | 'low';
  documentReference?: string;
  pageReference?: string;
  rationale?: string;
  followUpQuestions?: string[];
  exhibitToShow?: string;
}

export interface OutlineSection {
  id: string;
  title: string;
  order: number;
  questions: DepositionQuestion[];
  notes?: string;
  estimatedTime?: number; // in minutes
}

export interface DepositionOutline {
  id: string;
  title: string;
  sections: OutlineSection[];
  createdAt: string; // ISO string for localStorage serialization
  updatedAt: string; // ISO string for localStorage serialization
}

export interface DepositionSession {
  id: string;
  deponentName: string;
  caseName: string;
  caseNumber?: string;
  depositionDate?: string; // ISO string for localStorage serialization
  createdAt: string; // ISO string for localStorage serialization
  documents: DepositionDocument[];
  gaps: TestimonyGap[];
  contradictions: Contradiction[];
  questions: DepositionQuestion[];
  outline: DepositionOutline | null;
  status: 'setup' | 'uploading' | 'analyzing' | 'ready' | 'completed';
  analysis?: {
    keyThemes: string[];
    timelineEvents: Array<{
      date: string;
      event: string;
      source: string;
    }>;
    witnesses: string[];
    keyExhibits: string[];
  };
}

export interface DepositionQuestionGenerationRequest {
  documents: Array<{ name: string; content: string; type: string }>;
  deponentName: string;
  caseName: string;
  focusAreas?: string[];
  existingQuestions?: string[];
}

export interface AnalysisResult {
  gaps: TestimonyGap[];
  contradictions: Contradiction[];
  keyThemes: string[];
  timelineEvents: Array<{
    date: string;
    event: string;
    source: string;
  }>;
  witnesses: string[];
  keyExhibits: string[];
}

export interface ExportOptions {
  format: 'docx' | 'pdf' | 'txt';
  includeCitations: boolean;
  includeRationale: boolean;
  includeFollowUps: boolean;
  groupByTopic: boolean;
}

// Category display metadata
export const DEPOSITION_CATEGORIES: Record<DepositionQuestion['category'], { label: string; color: string }> = {
  gap: { label: 'Gap', color: 'orange' },
  contradiction: { label: 'Contradiction', color: 'red' },
  timeline: { label: 'Timeline', color: 'blue' },
  foundation: { label: 'Foundation', color: 'purple' },
  impeachment: { label: 'Impeachment', color: 'rose' },
  follow_up: { label: 'Follow-up', color: 'cyan' },
  general: { label: 'General', color: 'gray' },
};

export const PRIORITY_LEVELS: Record<DepositionQuestion['priority'], { label: string; color: string }> = {
  high: { label: 'High', color: 'red' },
  medium: { label: 'Medium', color: 'amber' },
  low: { label: 'Low', color: 'green' },
};

export const DOCUMENT_TYPES: Record<DepositionDocument['type'], string> = {
  prior_testimony: 'Prior Testimony',
  exhibit: 'Exhibit',
  transcript: 'Transcript',
  case_file: 'Case File',
  other: 'Other',
};
