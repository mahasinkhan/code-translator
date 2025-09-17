#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { LanguageDetector } from '../utils/language-detector';
import { SupportedLanguage } from '../types/index';
import * as fs from 'fs-extra';
import * as path from 'path';

const program = new Command();

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════════════════════╗
║  ____          _      _____                  _       _    ║
║ / ___|___   __| | ___/__   \\_ __ __ _ _ __  ___| | __ _| |_  ║
║| |   / _ \\ / _\` |/ _ \\ / /\\/ '__/ _\` | '_ \\/ __| |/ _\` | __| ║
║| |__| (_) | (_| |  __// /  | | | (_| | | | \\__ \\ | (_| | |_  ║
║ \\____\\___/ \\__,_|\\___\\/   |_|  \\__,_|_| |_|___/_|\\__,_|\\__| ║
║                                                           ║
║           AI-Powered Programming Language Converter        ║
╚═══════════════════════════════════════════════════════════╝
`;

async function main() {
  console.log(chalk.cyan(banner));
  
  program
    .name('code-translator')
    .description('AI-powered programming language converter')
    .version('0.1.0');

  // Main translate command
  program
    .command('translate')
    .description('Translate code from one language to another')
    .option('-i, --input <file>', 'Input file path')
    .option('-o, --output <file>', 'Output file path')
    .option('-f, --from <language>', 'Source language')
    .option('-t, --to <language>', 'Target language')
    .option('--ai', 'Use AI for translation', false)
    .option('--dry', 'Show what would be translated without writing files', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options) => {
      try {
        await handleTranslate(options);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Language detection command
  program
    .command('detect')
    .description('Detect the programming language of a file')
    .argument('<file>', 'File path to analyze')
    .option('-v, --verbose', 'Show detailed analysis', false)
    .action(async (filePath: string, options) => {
      try {
        await handleDetect(filePath, options);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // List supported languages
  program
    .command('languages')
    .description('List all supported programming languages')
    .option('--pairs', 'Show compatible translation pairs', false)
    .action((options) => {
      handleLanguages(options);
    });

  // Interactive mode
  program
    .command('interactive')
    .alias('i')
    .description('Start interactive translation mode')
    .action(async () => {
      try {
        await handleInteractive();
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

async function handleTranslate(options: any) {
  console.log(chalk.blue('🔄 Starting translation...'));
  
  // Validate input file
  if (!options.input) {
    throw new Error('Input file is required. Use -i or --input flag.');
  }

  if (!await fs.pathExists(options.input)) {
    throw new Error(`Input file not found: ${options.input}`);
  }

  const inputPath = path.resolve(options.input);
  const content = await fs.readFile(inputPath, 'utf-8');
  
  console.log(chalk.gray(`📁 Input: ${inputPath}`));
  console.log(chalk.gray(`📏 Size: ${content.length} characters`));

  // Detect source language
  let sourceLanguage: SupportedLanguage;
  if (options.from) {
    if (!LanguageDetector.isSupported(options.from)) {
      throw new Error(`Unsupported source language: ${options.from}`);
    }
    sourceLanguage = options.from as SupportedLanguage;
    console.log(chalk.green(`🔍 Source language (specified): ${sourceLanguage}`));
  } else {
    const detected = LanguageDetector.detect(inputPath, content);
    if (!detected) {
      throw new Error('Could not detect source language. Please specify with --from flag.');
    }
    sourceLanguage = detected;
    console.log(chalk.green(`🔍 Source language (detected): ${sourceLanguage}`));
  }

  // Validate target language
  if (!options.to) {
    throw new Error('Target language is required. Use -t or --to flag.');
  }
  
  if (!LanguageDetector.isSupported(options.to)) {
    throw new Error(`Unsupported target language: ${options.to}`);
  }

  const targetLanguage = options.to as SupportedLanguage;
  console.log(chalk.blue(`🎯 Target language: ${targetLanguage}`));

  // Check compatibility
  if (!LanguageDetector.areCompatible(sourceLanguage, targetLanguage)) {
    console.log(chalk.yellow(`⚠️  Warning: ${sourceLanguage} to ${targetLanguage} translation may be limited`));
  }

  // For now, just show what we would do
  console.log(chalk.cyan('\\n📋 Translation Plan:'));
  console.log(`   • Source: ${chalk.green(sourceLanguage)}`);
  console.log(`   • Target: ${chalk.blue(targetLanguage)}`);
  console.log(`   • AI Assisted: ${options.ai ? chalk.green('Yes') : chalk.gray('No')}`);
  console.log(`   • Lines to translate: ${chalk.yellow(content.split('\\n').length)}`);

  if (options.dry) {
    console.log(chalk.yellow('\\n🚫 Dry run - no files will be modified'));
    return;
  }

  // TODO: Actual translation will be implemented in next steps
  console.log(chalk.red('\\n🚧 Translation engine not yet implemented'));
  console.log(chalk.gray('This will be added in the next development phase.'));
}

async function handleDetect(filePath: string, options: any) {
  if (!await fs.pathExists(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const absolutePath = path.resolve(filePath);
  const content = await fs.readFile(absolutePath, 'utf-8');
  
  console.log(chalk.blue(`🔍 Analyzing: ${absolutePath}`));
  
  const fromExtension = LanguageDetector.detectFromExtension(absolutePath);
  const fromContent = LanguageDetector.detectFromContent(content);
  const finalDetection = LanguageDetector.detect(absolutePath, content);

  if (options.verbose) {
    console.log(chalk.gray('\\nDetection Results:'));
    console.log(`   Extension-based: ${fromExtension || chalk.red('unknown')}`);
    console.log(`   Content-based: ${fromContent || chalk.red('unknown')}`);
  }

  if (finalDetection) {
    const langInfo = LanguageDetector.getLanguageInfo(finalDetection);
    console.log(chalk.green(`\\n✅ Detected Language: ${langInfo.name}`));
    
    if (options.verbose) {
      console.log(chalk.gray('\\nLanguage Details:'));
      console.log(`   Extensions: ${langInfo.extensions.join(', ')}`);
      console.log(`   Grammar: ${langInfo.treeSitterGrammar}`);
      console.log(`   Features: ${langInfo.features.join(', ')}`);
    }
  } else {
    console.log(chalk.red('\n❌ Could not detect programming language'));
    console.log(chalk.gray('Try specifying the language manually with the --from flag'));
  }
}

function handleLanguages(options: any) {
  console.log(chalk.blue('🌍 Supported Programming Languages:\n'));
  
  const languages = LanguageDetector.getSupportedLanguages();
  
  languages.forEach(lang => {
    const info = LanguageDetector.getLanguageInfo(lang);
    console.log(`${chalk.green('●')} ${chalk.bold(info.name)}`);
    console.log(`   Extensions: ${chalk.gray(info.extensions.join(', '))}`);
    console.log(`   Features: ${chalk.cyan(info.features.join(', '))}\n`);
  });

  if (options.pairs) {
    console.log(chalk.blue('🔄 Compatible Translation Pairs:\n'));
    
    languages.forEach(sourceLang => {
      const compatibleTargets = languages.filter(targetLang => 
        sourceLang !== targetLang && LanguageDetector.areCompatible(sourceLang, targetLang)
      );
      
      if (compatibleTargets.length > 0) {
        const sourceInfo = LanguageDetector.getLanguageInfo(sourceLang);
        console.log(`${chalk.green(sourceInfo.name)} → ${compatibleTargets.map(t => 
          LanguageDetector.getLanguageInfo(t).name
        ).join(', ')}`);
      }
    });
  }
}

async function handleInteractive() {
  const inquirer = await import('inquirer');
  
  console.log(chalk.blue('🎯 Interactive Translation Mode\n'));
  
  const answers = await inquirer.default.prompt([
    {
      type: 'input',
      name: 'inputFile',
      message: 'Enter the path to your input file:',
      validate: async (input: string) => {
        if (!input.trim()) return 'Please enter a file path';
        if (!await fs.pathExists(input)) return 'File does not exist';
        return true;
      }
    },
    {
      type: 'list',
      name: 'sourceLanguage',
      message: 'Select source language (or auto-detect):',
      choices: [
        { name: 'Auto-detect', value: 'auto' },
        ...LanguageDetector.getSupportedLanguages().map(lang => ({
          name: LanguageDetector.getLanguageInfo(lang).name,
          value: lang
        }))
      ]
    },
    {
      type: 'list',
      name: 'targetLanguage',
      message: 'Select target language:',
      choices: (answers: any) => {
        const allLangs = LanguageDetector.getSupportedLanguages();
        if (answers.sourceLanguage === 'auto') {
          return allLangs.map(lang => ({
            name: LanguageDetector.getLanguageInfo(lang).name,
            value: lang
          }));
        }
        
        // Filter compatible languages
        const compatibleLangs = allLangs.filter(lang => 
          lang !== answers.sourceLanguage && 
          LanguageDetector.areCompatible(answers.sourceLanguage, lang)
        );
        
        return compatibleLangs.map(lang => ({
          name: LanguageDetector.getLanguageInfo(lang).name,
          value: lang
        }));
      }
    },
    {
      type: 'input',
      name: 'outputFile',
      message: 'Enter output file path (optional):',
      default: (answers: any) => {
        const inputPath = answers.inputFile;
        const ext = LanguageDetector.getExtensions(answers.targetLanguage)[0];
        return inputPath.replace(/\.[^.]+$/, ext || '.out');
      }
    },
    {
      type: 'confirm',
      name: 'useAI',
      message: 'Use AI for intelligent translation?',
      default: true
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with translation?',
      default: true
    }
  ]);

  if (!answers.confirm) {
    console.log(chalk.yellow('Translation cancelled.'));
    return;
  }

  // Auto-detect source language if needed
  let sourceLanguage = answers.sourceLanguage;
  if (sourceLanguage === 'auto') {
    const content = await fs.readFile(answers.inputFile, 'utf-8');
    const detected = LanguageDetector.detect(answers.inputFile, content);
    if (!detected) {
      throw new Error('Could not auto-detect source language');
    }
    sourceLanguage = detected;
    console.log(chalk.green(`Auto-detected source language: ${LanguageDetector.getLanguageInfo(detected).name}`));
  }

  // Call the translation with the collected options
  await handleTranslate({
    input: answers.inputFile,
    output: answers.outputFile,
    from: sourceLanguage,
    to: answers.targetLanguage,
    ai: answers.useAI,
    verbose: true
  });
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}