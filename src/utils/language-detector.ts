import * as path from 'path';
import { SupportedLanguage, LanguageInfo } from '../types/index';

export class LanguageDetector {
  private static readonly LANGUAGE_MAP: Record<SupportedLanguage, LanguageInfo> = {
    [SupportedLanguage.PYTHON]: {
      name: 'Python',
      extensions: ['.py', '.pyw', '.pyi'],
      treeSitterGrammar: 'python',
      mimeType: 'text/x-python',
      commentStyle: { line: '#', blockStart: '"""', blockEnd: '"""' },
      features: ['classes', 'decorators', 'lambdas', 'async_await', 'type_annotations', 'modules']
    },
    [SupportedLanguage.JAVASCRIPT]: {
      name: 'JavaScript',
      extensions: ['.js', '.mjs', '.cjs', '.jsx'],
      treeSitterGrammar: 'javascript',
      mimeType: 'text/javascript',
      commentStyle: { line: '//', blockStart: '/*', blockEnd: '*/' },
      features: ['classes', 'async_await', 'lambdas', 'modules']
    },
    [SupportedLanguage.TYPESCRIPT]: {
      name: 'TypeScript',
      extensions: ['.ts', '.tsx', '.d.ts'],
      treeSitterGrammar: 'typescript',
      mimeType: 'text/typescript',
      commentStyle: { line: '//', blockStart: '/*', blockEnd: '*/' },
      features: ['classes', 'interfaces', 'generics', 'decorators', 'type_annotations', 'modules']
    },
    [SupportedLanguage.JAVA]: {
      name: 'Java',
      extensions: ['.java'],
      treeSitterGrammar: 'java',
      mimeType: 'text/x-java-source',
      commentStyle: { line: '//', blockStart: '/*', blockEnd: '*/' },
      features: ['classes', 'interfaces', 'generics', 'lambdas', 'modules']
    },
    [SupportedLanguage.CSHARP]: {
      name: 'C#',
      extensions: ['.cs', '.csx'],
      treeSitterGrammar: 'c_sharp',
      mimeType: 'text/x-csharp',
      commentStyle: { line: '//', blockStart: '/*', blockEnd: '*/' },
      features: ['classes', 'interfaces', 'generics', 'lambdas', 'async_await', 'namespaces']
    },
    [SupportedLanguage.CPP]: {
      name: 'C++',
      extensions: ['.cpp', '.cc', '.cxx', '.c++', '.hpp', '.h'],
      treeSitterGrammar: 'cpp',
      mimeType: 'text/x-c++src',
      commentStyle: { line: '//', blockStart: '/*', blockEnd: '*/' },
      features: ['classes', 'namespaces', 'lambdas']
    },
    [SupportedLanguage.GO]: {
      name: 'Go',
      extensions: ['.go'],
      treeSitterGrammar: 'go',
      mimeType: 'text/x-go',
      commentStyle: { line: '//', blockStart: '/*', blockEnd: '*/' },
      features: ['interfaces', 'modules']
    }
  } as const;

  /**
   * Detect language from file extension
   */
  static detectFromExtension(filePath: string): SupportedLanguage | null {
    const ext = path.extname(filePath).toLowerCase();
    
    for (const [lang, info] of Object.entries(this.LANGUAGE_MAP)) {
      if (info.extensions.includes(ext)) {
        return lang as SupportedLanguage;
      }
    }
    
    return null;
  }

  /**
   * Detect language from file content using patterns and keywords
   */
  static detectFromContent(content: string): SupportedLanguage | null {
    const patterns = {
      [SupportedLanguage.PYTHON]: [
        /^#!/usr/bin/env python/m,
        /^#!/usr/bin/python/m,
        /^#.*coding[:=]\s*([-\w.]+)/m,
        /\bdef\s+\w+\s*\(/,
        /\bimport\s+\w+/,
        /\bfrom\s+\w+\s+import/,
        /\bif\s+__name__\s*==\s*['"']__main__['"']/
      ],
      [SupportedLanguage.JAVASCRIPT]: [
        /\bfunction\s+\w+\s*\(/,
        /\bconst\s+\w+\s*=/,
        /\blet\s+\w+\s*=/,
        /\brequire\s*\(/,
        /\bmodule\.exports/,
        /\bconsole\.log\s*\(/,
        /\b(async|await)\b/
      ],
      [SupportedLanguage.TYPESCRIPT]: [
        /\binterface\s+\w+/,
        /\btype\s+\w+\s*=/,
        /:\s*(string|number|boolean|any)\b/,
        /\bimport\s+.*\bfrom\s+['"][^'"]+['"];?/,
        /\bexport\s+(interface|type|class)/
      ],
      [SupportedLanguage.JAVA]: [
        /\bpublic\s+class\s+\w+/,
        /\bpublic\s+static\s+void\s+main/,
        /\bpackage\s+[\w.]+;/,
        /\bimport\s+[\w.]+;/,
        /\b(public|private|protected)\s+(static\s+)?\w+\s+\w+\s*\(/
      ],
      [SupportedLanguage.CSHARP]: [
        /\busing\s+[\w.]+;/,
        /\bnamespace\s+[\w.]+/,
        /\bpublic\s+class\s+\w+/,
        /\bstatic\s+void\s+Main/,
        /\bConsole\.WriteLine\s*\(/,
        /\b(public|private|internal)\s+(static\s+)?\w+\s+\w+\s*\(/
      ],
      [SupportedLanguage.CPP]: [
        /\b#include\s*<[^>]+>/,
        /\b#include\s*"[^"]+"/,
        /\busing\s+namespace\s+\w+;/,
        /\bstd::/,
        /\bint\s+main\s*\(/,
        /\bcout\s*<</
      ],
      [SupportedLanguage.GO]: [
        /\bpackage\s+\w+/,
        /\bimport\s+\(/,
        /\bfunc\s+\w+\s*\(/,
        /\bfunc\s+main\s*\(\s*\)/,
        /\bfmt\.Print/,
        /\b(var|const)\s+\w+/
      ]
    };

    const scores: Record<SupportedLanguage, number> = {
      [SupportedLanguage.PYTHON]: 0,
      [SupportedLanguage.JAVASCRIPT]: 0,
      [SupportedLanguage.TYPESCRIPT]: 0,
      [SupportedLanguage.JAVA]: 0,
      [SupportedLanguage.CSHARP]: 0,
      [SupportedLanguage.CPP]: 0,
      [SupportedLanguage.GO]: 0
    };

    // Score each language based on pattern matches
    for (const [lang, langPatterns] of Object.entries(patterns)) {
      for (const pattern of langPatterns) {
        if (pattern.test(content)) {
          scores[lang as SupportedLanguage]++;
        }
      }
    }

    // Find the language with the highest score
    const sortedLanguages = Object.entries(scores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .filter(([, score]) => score > 0);

    if (sortedLanguages.length === 0) {
      return null;
    }

    return sortedLanguages[0]![0] as SupportedLanguage;
  }

  /**
   * Detect language using both extension and content analysis
   */
  static detect(filePath: string, content: string): SupportedLanguage | null {
    // Try extension first
    const fromExtension = this.detectFromExtension(filePath);
    if (fromExtension) {
      return fromExtension;
    }

    // Fallback to content analysis
    return this.detectFromContent(content);
  }

  /**
   * Get language information
   */
  static getLanguageInfo(language: SupportedLanguage): LanguageInfo {
    return this.LANGUAGE_MAP[language];
  }

  /**
   * Check if language is supported
   */
  static isSupported(language: string): language is SupportedLanguage {
    return Object.values(SupportedLanguage).includes(language as SupportedLanguage);
  }

  /**
   * Get all supported languages
   */
  static getSupportedLanguages(): SupportedLanguage[] {
    return Object.values(SupportedLanguage);
  }

  /**
   * Get file extensions for a language
   */
  static getExtensions(language: SupportedLanguage): string[] {
    return this.LANGUAGE_MAP[language].extensions;
  }

  /**
   * Check if two languages are compatible for translation
   */
  static areCompatible(source: SupportedLanguage, target: SupportedLanguage): boolean {
    // Define compatibility matrix
    const compatibilityMatrix: Record<SupportedLanguage, SupportedLanguage[]> = {
      [SupportedLanguage.PYTHON]: [
        SupportedLanguage.JAVASCRIPT,
        SupportedLanguage.TYPESCRIPT,
        SupportedLanguage.JAVA
      ],
      [SupportedLanguage.JAVASCRIPT]: [
        SupportedLanguage.PYTHON,
        SupportedLanguage.TYPESCRIPT,
        SupportedLanguage.JAVA
      ],
      [SupportedLanguage.TYPESCRIPT]: [
        SupportedLanguage.JAVASCRIPT,
        SupportedLanguage.PYTHON,
        SupportedLanguage.JAVA,
        SupportedLanguage.CSHARP
      ],
      [SupportedLanguage.JAVA]: [
        SupportedLanguage.CSHARP,
        SupportedLanguage.PYTHON,
        SupportedLanguage.JAVASCRIPT,
        SupportedLanguage.TYPESCRIPT
      ],
      [SupportedLanguage.CSHARP]: [
        SupportedLanguage.JAVA,
        SupportedLanguage.TYPESCRIPT,
        SupportedLanguage.CPP
      ],
      [SupportedLanguage.CPP]: [
        SupportedLanguage.CSHARP,
        SupportedLanguage.JAVA
      ],
      [SupportedLanguage.GO]: [
        SupportedLanguage.JAVA,
        SupportedLanguage.CSHARP
      ]
    };

    return compatibilityMatrix[source]?.includes(target) ?? false;
  }
}