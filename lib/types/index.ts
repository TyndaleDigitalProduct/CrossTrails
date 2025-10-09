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
  anchor_ref?: string; // e.g., "Phlm.1" (optional, for data linkage)
  category?: CrossReferenceCategory; // optional, for granular category
  reasoning?: string; // optional, explanation of the connection
}

export interface ConnectionData {
  categories: string[]; // e.g., ["salvation", "love", "sacrifice"]
  strength: number; // 0.0 to 1.0
  type: CrossReferenceCategory;
  explanation?: string; // Brief explanation of connection
  reasoning?: string; // optional, detailed reasoning from data
}

// Expanded category system based on category_cheat_sheet.json
export type CrossReferenceCategory =
  | "allusion"
  | "christological_parallel"
  | "contrast"
  | "covenant_connection"
  | "elaboration"
  | "exemplification"
  | "greek_word"
  | "hebrew_word"
  | "historical_pattern"
  | "historical_reference"
  | "legal_parallel"
  | "literary_parallel"
  | "narrative_continuation"
  | "numerology"
  | "parallel_account"
  | "parallel_instruction"
  | "prophecy_fulfillment"
  | "prophetic_parallel"
  | "quotation"
  | "ritual_practice"
  | "septuagint_difference"
  | "shared_metaphor"
  | "thematic_echo"
  | "theological_principle"
  | "typology"
  | "wisdom_parallel"
  | "wisdom_principle";

// Types for cross-reference data files (e.g., Phlm.json)
export interface CrossReferenceDataFile {
  book: string;
  book_number: number;
  verified: boolean;
  total_items: number;
  improved_count: number;
  category_distribution: Record<string, number>;
  items: CrossReferenceDataItem[];
}

export interface CrossReferenceDataItem {
  anchor_ref: string; // e.g., "Phlm.1"
  cross_ref: string; // e.g., "Eph.3.1"
  primary_category: CrossReferenceCategory;
  secondary_category: CrossReferenceCategory | null;
  confidence: number; // 0 to 100
  reasoning: string;
  // Optionally add more fields if present in data
}

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
    type: CrossReferenceCategory;
    explanation: string;
    metadata: {
      thematic_overlap: number;
      historical_context: boolean;
      literary_connection: boolean;
    };
  }[];
}

export interface CrossReferencePromptRequest {
  crossReference: CrossReference;
  userObservation?: string;
  contextRange?: number; // Number of verses before/after to include
  promptTemplate?: 'default' | 'study' | 'devotional' | 'academic';
}

export interface CrossReferencePromptResponse {
  prompt: string;
  sources: {
    anchor_verse: {
      reference: string;
      text: string;
      context?: string[];
    };
    cross_reference: {
      reference: string;
      text: string;
      context?: string[];
    };
    connection_data: {
      categories: string[];
      strength: number;
      reasoning?: string;
      explanation?: string;
    };
  };
  metadata: {
    prompt_length: number;
    context_verses_included: number;
    template_used: string;
  };
}

// ============================================================================
// LLM Client Types
// ============================================================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  metadata?: Record<string, any>;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason: 'stop' | 'length' | 'error';
  metadata?: Record<string, any>;
}

export interface LLMStreamResponse {
  content: string;
  done: boolean;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMProvider {
  name: string;
  supportedModels: string[];
  supportsStreaming: boolean;
  chat(request: LLMRequest): Promise<LLMResponse>;
  stream?(request: LLMRequest): AsyncGenerator<LLMStreamResponse>;
  healthCheck(): Promise<boolean>;
}

export interface LLMClientConfig {
  provider: 'gloo' | 'openai' | 'azure' | 'anthropic';
  model?: string;
  temperature?: number;
  max_tokens?: number;
  baseUrl?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface CrossReferenceAnalysisRequest {
  crossReference: CrossReference;
  userObservation?: string;
  analysisType?: 'default' | 'study' | 'devotional' | 'academic';
  contextRange?: number;
}

export interface CrossReferenceAnalysisResponse {
  analysis: string;
  prompt_used: string;
  sources: CrossReferencePromptResponse['sources'];
  llm_metadata: {
    model: string;
    provider: string;
    usage: LLMResponse['usage'];
    response_time_ms: number;
  };
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

export interface SearchAPIResponse {
  book: string;
  chapter: number;
  text: string;
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
  error?: string | null;
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