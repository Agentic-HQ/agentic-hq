#!/usr/bin/env tsx
/**
 * Fake Claude CLI Fixture for Unit Testing File I/O
 *
 * Simulates what a real Claude CLI would do when running the "reverse-a-string"
 * command: reading command-input.json, reversing the string, and writing the result to command-output.json.
 * This is TEST SCAFFOLDING - it replaces real Claude in unit tests.
 *
 * USAGE: tsx fake-claude-cli.reverses-a-string-using-files.fixture.ts <command-input-output-files-directory>
 *
 * Input file: <command-input-output-files-directory>/command-input.json
 *   { "command-input-string": "hello world" }
 *
 * Output file: <command-input-output-files-directory>/command-output.json
 *   { "command-output-string": "dlrow olleh" }
 *
 * Used by: tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts
 * See: https://agentic-hq.atlassian.net/browse/AHQ-9
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const commandInputOutputFilesDirectory = process.argv[2];

console.log(`Fake Claude CLI in fake-claude-cli.reverses-a-string-using-files.fixture.ts running 
  with command-input-output-files-directory: ${commandInputOutputFilesDirectory}`);
console.log(`And going to pretending to be Claude Code running the "reverse-a-string" command`);

if (!commandInputOutputFilesDirectory) {
  console.error('ERROR: command-input-output-files-directory path not provided');
  process.exit(1);
}

// Read input
const inputPath = path.join(commandInputOutputFilesDirectory, 'command-input.json');

if (!fs.existsSync(inputPath)) {
  console.error(`ERROR: Command input file not found: ${inputPath}`);
  process.exit(1);
}

const inputJson = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as {
  'command-input-string': string;
};
const commandInputString = inputJson['command-input-string'];

if (typeof commandInputString !== 'string') {
  console.error('ERROR: command-input-string must be a string');
  process.exit(1);
}

// Reverse the string
const reversedString = commandInputString.split('').reverse().join('');

// Write output
const outputPath = path.join(commandInputOutputFilesDirectory, 'command-output.json');
fs.writeFileSync(outputPath, JSON.stringify({ 'command-output-string': reversedString }, null, 2));

console.log(`Fake Claude: Reversed "${commandInputString}" to "${reversedString}"`);
process.exit(0);
