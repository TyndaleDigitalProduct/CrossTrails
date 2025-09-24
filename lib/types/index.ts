// CrossTrails TypeScript Type Definitions

// ============================================================================
// Bible Text Types
// ============================================================================

export interface BibleVerse {
  verse_number: number;
  verse_id: string; // e.g., "John.3.16"
  text: string;
  cross_reference_spans?: CrossReferenceSpan[]; // Underlined portions
}

export interface CrossReferenceSpan {
  start_index: number;
  end_index: number;
  text: string;
  cross_references: string[]; // Array of verse IDs this span links to
}

export interface BibleChapter {
  reference: string; // e.g., "John.3.16-31"
  book: string; // e.g., "John"
  chapter: number;
  verses: BibleVerse[];
  translation: string; // Always "NLT" for CrossTrails
  copyright: string;
}

// ============================================================================
// Cross-Reference Types
// ============================================================================

export interface CrossReference {
  reference: string; // e.g., "Rom.5.8"
  display_ref: string; // e.g., "Romans 5:8"
  text: string;
  connection: ConnectionData;
  context?: {
    book: string;
    chapter: number;
    verse: number;
  };
}

export interface ConnectionData {
  categories: string[]; // e.g., ["salvation", "love", "sacrifice"]
  strength: number; // 0.0 to 1.0
  type: ConnectionType;
  explanation?: string; // Brief explanation of connection
}

export type ConnectionType =
  | "parallel"
  | "contrast"
  | "fulfillment"
  | "prophecy"
  | "quotation"
  | "allusion"
  | "thematic"
  | "historical";

export interface CrossReferenceGroup {
  anchor_verse: string; // e.g., "John.3.16"
  cross_references: CrossReference[];
  total_found: number;
  returned: number;
}

// ============================================================================
// MCP Tool Types
// ============================================================================

export interface VerseContextRequest {
  references: string[];
  include_context?: boolean;
  context_range?: number; // Verses before/after
}

export interface VerseContextResponse {
  verses: BibleVerse[];
  context?: {
    reference: string;
    text: string;
    position: 'before' | 'after';
  }[];
}

export interface CrossReferenceConnectionRequest {
  anchor_verse: string;
  candidate_refs: string[];
  min_strength?: number;
}

export interface CrossReferenceConnectionResponse {
  connections: {
    reference: string;
    strength: number;
    categories: string[];
    type: ConnectionType;
    explanation: string;
    metadata: {
      thematic_overlap: number;
      historical_context: boolean;
      literary_connection: boolean;
    };
  }[];
}

// ============================================================================
// AI Companion Types
// ============================================================================

export interface ExploreQuery {
  selectedVerses: string[];
  userObservation: string;
  selectedCrossRefs: string[];
  conversation_history?: ConversationTurn[];
}

export interface ConversationTurn {
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: SourceData[];
}

export interface SourceData {
  type: 'verse' | 'cross_reference' | 'study_note' | 'dictionary';
  reference: string;
  text?: string;
  connection?: ConnectionData;
}

export interface AIResponse {
  content: string;
  sources: SourceData[];
  streaming: boolean;
  timestamp: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface AppState {
  currentPassage: {
    book: string;
    chapter: number;
    verses: BibleVerse[];
  };
  selection: {
    verses: string[]; // Selected verse IDs
    cross_refs: string[]; // Selected cross-reference IDs
  };
  cross_references: CrossReferenceGroup[];
  conversation: {
    user_observation: string;
    ai_response?: AIResponse;
    history: ConversationTurn[];
  };
  ui: {
    loading: {
      verses: boolean;
      cross_refs: boolean;
      ai_response: boolean;
    };
    error: string | null;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    request_id: string;
  };
}

export interface VersesAPIResponse {
  reference: string;
  book: string;
  chapter: number;
  verses: BibleVerse[];
  translation: string;
  copyright: string;
}

export interface CrossRefsAPIResponse {
  anchor_verses: string[];
  cross_references: CrossReference[];
  total_found: number;
  returned: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface FeatureFlags {
  studyNotesEnabled: boolean;
  dictionaryEnabled: boolean;
  aiCompanionEnabled: boolean;
  advancedCrossRefs: boolean;
}

export interface BibleReference {
  book: string;
  chapter: number;
  verse?: number;
  endVerse?: number;
}

// ============================================================================
// Component Prop Types
// ============================================================================

export interface BibleReaderProps {
  book: string;
  chapter: number;
  verses: BibleVerse[];
  selectedVerses: string[];
  onVerseSelect: (verses: string[]) => void;
  loading?: boolean;
}

export interface CrossReferencesSidebarProps {
  crossReferences: CrossReferenceGroup[];
  selectedRefs: string[];
  onRefSelect: (refs: string[]) => void;
  loading?: boolean;
}

export interface AICompanionProps {
  selectedVerses: string[];
  selectedCrossRefs: string[];
  onSubmitObservation: (observation: string) => void;
  aiResponse?: AIResponse;
  conversation_history: ConversationTurn[];
}

export interface HeaderProps {
  currentBook: string;
  currentChapter: number;
  onNavigate: (book: string, chapter: number) => void;
  onSearch: (query: string) => void;
}