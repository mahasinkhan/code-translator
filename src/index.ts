#!/usr/bin/env node

/**
 * Code Translator - Main Entry Point
 * 
 * This is the main entry point for the Code Translator application.
 * It sets up the environment and delegates to the CLI handler.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Setup module path resolution for development
if (process.env.NODE_ENV === 'development') {
  require('module-alias/register');
}

// Set up global error handlers
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Ensure proper working directory
if (process.cwd() !== path.dirname(__filename)) {
  process.chdir(path.dirname(__filename));
}

// Start the CLI application
require('./cli/index');