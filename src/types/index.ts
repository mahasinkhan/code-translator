// Core language types
export enum SupportedLanguage {
  PYTHON = 'python',
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  JAVA = 'java',
  CSHARP = 'csharp',
  CPP = 'cpp',
  GO = 'go'
}

// Language metadata
export interface LanguageInfo {
  name: string;
  extensions: string[];
  treeSitterGrammar: string;
  mimeType: string;
  commentStyle: {
    line: string;
    blockStart?: string;
    blockEnd?: string;
  };
  features: LanguageFeature[];
}

export enum LanguageFeature {
  CLASSES = 'classes',
  INTERFACES = 'interfaces',
  GENERICS = 'generics',
  ASYNC_AWAIT = 'async_await',
  LAMBDAS = 'lambdas',
  DECORATORS = 'decorators',
  TYPE_ANNOTATIONS = 'type_annotations',
  MODULES = 'modules',
  NAMESPACES = 'namespaces'
}

// AST and parsing types
export interface ParsedNode {
  type: string;
  startPosition: Position;
  endPosition: Position;
  text: string;
  children: ParsedNode[];
  parent?: ParsedNode;
}

export interface Position {
  row: number;
  column: number;
}

export interface ParseResult {
  ast: ParsedNode;
  language: SupportedLanguage;
  errors: ParseError[];
  source: string;
}

export interface ParseError {
  message: string;
  position: Position;
  severity: 'error' | 'warning';
}

// Translation types
export interface TranslationOptions {
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  useAI: boolean;
  preserveComments: boolean;
  formatOutput: boolean;
  strictMode: boolean;
  customRules?: TranslationRule[];
}

export interface TranslationRule {
  id: string;
  sourcePattern: string;
  targetPattern: string;
  conditions?: Record<string, any>;
}

export interface TranslationResult {
  translatedCode: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  confidence: number;
  warnings: TranslationWarning[];
  metadata: TranslationMetadata;
}

export interface TranslationWarning {
  message: string;
  position?: Position;
  severity: 'info' | 'warning' | 'error';
  suggestion?: string;
}

export interface TranslationMetadata {
  translationTime: number;
  aiAssisted: boolean;
  rulesApplied: string[];
  complexity: 'low' | 'medium' | 'high';
}

// File and project types
export interface SourceFile {
  path: string;
  content: string;
  language: SupportedLanguage;
  size: number;
  lastModified: Date;
}

export interface TranslationProject {
  name: string;
  sourceFiles: SourceFile[];
  options: TranslationOptions;
  outputDirectory: string;
}

// CLI types
export interface CLIOptions {
  input?: string;
  output?: string;
  from?: string;
  to?: string;
  batch?: boolean;
  interactive?: boolean;
  useAI?: boolean;
  config?: string;
  verbose?: boolean;
  dry?: boolean;
}

// Configuration types
export interface AppConfig {
  ai: {
    provider: 'anthropic' | 'openai' | 'huggingface';
    apiKey?: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  translation: {
    defaultOptions: Partial<TranslationOptions>;
    cacheEnabled: boolean;
    parallelProcessing: boolean;
  };
  output: {
    formatting: boolean;
    preserveStructure: boolean;
    generateComments: boolean;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    file?: string;
  };
}

// Utility types
export type LanguagePair = `${SupportedLanguage}-${SupportedLanguage}`;

export interface ProcessingStats {
  filesProcessed: number;
  linesTranslated: number;
  timeElapsed: number;
  successRate: number;
  averageConfidence: number;
}

// Error types
export class TranslationError extends Error {
  constructor(
    message: string,
    public code: string,
    public position?: Position,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

export class ParseError extends Error {
  constructor(
    message: string,
    public position: Position,
    public source: string
  ) {
    super(message);
    this.name = 'ParseError';
  }
}