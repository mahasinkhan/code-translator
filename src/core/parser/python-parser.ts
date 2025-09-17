import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';
import { ParsedNode, ParseResult, ParseError, Position, SupportedLanguage } from '@types/index';

export class PythonParser {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Python);
  }

  /**
   * Parse Python source code and return AST
   */
  parse(sourceCode: string): ParseResult {
    const tree = this.parser.parse(sourceCode);
    const errors: ParseError[] = [];
    
    // Convert Tree-sitter tree to our format
    const ast = this.convertNode(tree.rootNode, sourceCode);
    
    // Check for parsing errors
    if (tree.rootNode.hasError()) {
      this.collectErrors(tree.rootNode, sourceCode, errors);
    }

    return {
      ast,
      language: SupportedLanguage.PYTHON,
      errors,
      source: sourceCode
    };
  }

  /**
   * Convert Tree-sitter node to our ParsedNode format
   */
  private convertNode(node: Parser.SyntaxNode, source: string): ParsedNode {
    const startPosition: Position = {
      row: node.startPosition.row,
      column: node.startPosition.column
    };

    const endPosition: Position = {
      row: node.endPosition.row,
      column: node.endPosition.column
    };

    const children: ParsedNode[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        const childNode = this.convertNode(child, source);
        childNode.parent = undefined; // Will be set after creation to avoid circular refs
        children.push(childNode);
      }
    }

    const parsedNode: ParsedNode = {
      type: node.type,
      startPosition,
      endPosition,
      text: node.text,
      children
    };

    // Set parent references
    children.forEach(child => {
      child.parent = parsedNode;
    });

    return parsedNode;
  }

  /**
   * Collect parsing errors from the tree
   */
  private collectErrors(node: Parser.SyntaxNode, source: string, errors: ParseError[]): void {
    if (node.hasError()) {
      if (node.type === 'ERROR') {
        errors.push({
          message: `Syntax error at ${node.startPosition.row}:${node.startPosition.column}`,
          position: {
            row: node.startPosition.row,
            column: node.startPosition.column
          },
          severity: 'error'
        });
      }

      // Check children for more errors
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
          this.collectErrors(child, source, errors);
        }
      }
    }
  }

  /**
   * Find nodes of a specific type
   */
  findNodesByType(ast: ParsedNode, nodeType: string): ParsedNode[] {
    const results: ParsedNode[] = [];
    
    const traverse = (node: ParsedNode) => {
      if (node.type === nodeType) {
        results.push(node);
      }
      node.children.forEach(traverse);
    };

    traverse(ast);
    return results;
  }

  /**
   * Extract function definitions from the AST
   */
  extractFunctions(ast: ParsedNode): PythonFunction[] {
    const functionNodes = this.findNodesByType(ast, 'function_definition');
    
    return functionNodes.map(node => {
      const nameNode = node.children.find(child => child.type === 'identifier');
      const parametersNode = node.children.find(child => child.type === 'parameters');
      const bodyNode = node.children.find(child => child.type === 'block');
      
      return {
        name: nameNode?.text || 'unknown',
        parameters: this.extractParameters(parametersNode),
        body: bodyNode?.text || '',
        startLine: node.startPosition.row,
        endLine: node.endPosition.row,
        isAsync: node.children.some(child => child.text === 'async'),
        decorators: this.extractDecorators(node)
      };
    });
  }

  /**
   * Extract class definitions from the AST
   */
  extractClasses(ast: ParsedNode): PythonClass[] {
    const classNodes = this.findNodesByType(ast, 'class_definition');
    
    return classNodes.map(node => {
      const nameNode = node.children.find(child => child.type === 'identifier');
      const bodyNode = node.children.find(child => child.type === 'block');
      const superclassNode = node.children.find(child => child.type === 'argument_list');
      
      return {
        name: nameNode?.text || 'unknown',
        superclasses: this.extractSuperclasses(superclassNode),
        methods: this.extractMethods(bodyNode),
        startLine: node.startPosition.row,
        endLine: node.endPosition.row,
        decorators: this.extractDecorators(node)
      };
    });
  }

  /**
   * Extract import statements
   */
  extractImports(ast: ParsedNode): PythonImport[] {
    const importNodes = [
      ...this.findNodesByType(ast, 'import_statement'),
      ...this.findNodesByType(ast, 'import_from_statement')
    ];

    return importNodes.map(node => {
      const isFromImport = node.type === 'import_from_statement';
      
      if (isFromImport) {
        const moduleNode = node.children.find(child => 
          child.type === 'dotted_name' || child.type === 'relative_import'
        );
        const importListNode = node.children.find(child => child.type === 'import_list');
        
        return {
          type: 'from',
          module: moduleNode?.text || '',
          names: this.extractImportNames(importListNode),
          alias: null,
          startLine: node.startPosition.row
        };
      } else {
        const importListNode = node.children.find(child => child.type === 'import_list');
        const names = this.extractImportNames(importListNode);
        
        return {
          type: 'import',
          module: names[0]?.name || '',
          names: names,
          alias: names[0]?.alias || null,
          startLine: node.startPosition.row
        };
      }
    });
  }

  private extractParameters(parametersNode?: ParsedNode): PythonParameter[] {
    if (!parametersNode) return [];
    
    const params: PythonParameter[] = [];
    const paramNodes = parametersNode.children.filter(child => 
      child.type === 'identifier' || child.type === 'default_parameter' || child.type === 'typed_parameter'
    );

    paramNodes.forEach(node => {
      if (node.type === 'identifier') {
        params.push({
          name: node.text,
          type: null,
          defaultValue: null
        });
      } else if (node.type === 'default_parameter') {
        const nameNode = node.children.find(child => child.type === 'identifier');
        const valueNode = node.children[node.children.length - 1]; // Last child is the default value
        
        params.push({
          name: nameNode?.text || 'unknown',
          type: null,
          defaultValue: valueNode?.text || null
        });
      } else if (node.type === 'typed_parameter') {
        const nameNode = node.children.find(child => child.type === 'identifier');
        const typeNode = node.children.find(child => child.type === 'type');
        
        params.push({
          name: nameNode?.text || 'unknown',
          type: typeNode?.text || null,
          defaultValue: null
        });
      }
    });

    return params;
  }

  private extractDecorators(node: ParsedNode): string[] {
    const decorators: string[] = [];
    let current = node.parent;
    
    while (current && current.type === 'decorated_definition') {
      const decoratorNodes = current.children.filter(child => child.type === 'decorator');
      decorators.push(...decoratorNodes.map(d => d.text));
      current = current.parent;
    }
    
    return decorators;
  }

  private extractSuperclasses(superclassNode?: ParsedNode): string[] {
    if (!superclassNode) return [];
    
    return superclassNode.children
      .filter(child => child.type === 'identifier' || child.type === 'attribute')
      .map(child => child.text);
  }

  private extractMethods(bodyNode?: ParsedNode): PythonFunction[] {
    if (!bodyNode) return [];
    
    const functionNodes = this.findNodesByType(bodyNode, 'function_definition');
    return functionNodes.map(node => {
      const nameNode = node.children.find(child => child.type === 'identifier');
      const parametersNode = node.children.find(child => child.type === 'parameters');
      
      return {
        name: nameNode?.text || 'unknown',
        parameters: this.extractParameters(parametersNode),
        body: node.text,
        startLine: node.startPosition.row,
        endLine: node.endPosition.row,
        isAsync: node.children.some(child => child.text === 'async'),
        decorators: this.extractDecorators(node)
      };
    });
  }

  private extractImportNames(importListNode?: ParsedNode): Array<{name: string, alias?: string}> {
    if (!importListNode) return [];
    
    const names: Array<{name: string, alias?: string}> = [];
    
    importListNode.children.forEach(child => {
      if (child.type === 'identifier') {
        names.push({ name: child.text });
      } else if (child.type === 'aliased_import') {
        const nameNode = child.children[0];
        const aliasNode = child.children[2]; // "as" keyword is at index 1
        
        names.push({
          name: nameNode?.text || '',
          alias: aliasNode?.text || undefined
        });
      }
    });
    
    return names;
  }
}

// Type definitions for Python-specific structures
export interface PythonFunction {
  name: string;
  parameters: PythonParameter[];
  body: string;
  startLine: number;
  endLine: number;
  isAsync: boolean;
  decorators: string[];
}

export interface PythonParameter {
  name: string;
  type: string | null;
  defaultValue: string | null;
}

export interface PythonClass {
  name: string;
  superclasses: string[];
  methods: PythonFunction[];
  startLine: number;
  endLine: number;
  decorators: string[];
}

export interface PythonImport {
  type: 'import' | 'from';
  module: string;
  names: Array<{name: string, alias?: string}>;
  alias: string | null;
  startLine: number;
}