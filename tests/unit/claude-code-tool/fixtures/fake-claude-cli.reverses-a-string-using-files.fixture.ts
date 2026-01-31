#!/usr/bin/env tsx
/**
 * Fake Claude CLI Fixture for Unit Testing File I/O
 *
 * Simulates what a real Claude CLI would do when running the "reverse-a-string"
 * command: reading command-input.json, reversing the string, and writing the result to command-output.json.
 * This is TEST SCAFFOLDING - it replaces real Claude in unit tests.
 *
 * USAGE: tsx fake-claude-cli.reverses-a-string-using-files.fixture.ts "<command> <tempDir>"
 *
 * NOTE: The command and tempDir are passed as a SINGLE combined string (argv[2]),
 * NOT as separate arguments. This replicates how real Claude receives its prompt.
 *
 * Input file: <tempDir>/command-input.json
 *   { "command-input-string": "hello world" }
 *
 * Output file: <tempDir>/command-output.json
 *   { "command-output-string": "dlrow olleh" }
 *
 * Used by: tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts
 * See: https://agentic-hq.atlassian.net/browse/AHQ-9
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/*
 * ARGV PARSING - REPLICATING REAL CLAUDE CLI BEHAVIOR
 *
 * Real Claude CLI receives a single prompt string containing both the slash command
 * and its arguments. For example:
 *
 *   claude --print "/reverse-a-string /path/to/temp/dir"
 *
 * Claude internally parses this string to:
 * - Recognize "/reverse-a-string" as a slash command
 * - Make "/path/to/temp/dir" available as $0 in the command's markdown file
 *
 * This fake CLI replicates that behavior by:
 * 1. Receiving the combined string as argv[2] (after 'tsx' and 'fixture.ts')
 * 2. Splitting on space to extract [command, tempDir]
 * 3. Using tempDir to find command-input.json and write command-output.json
 *
 * This ensures ClaudeCodeTool.ts can pass arguments identically to both real Claude
 * and test fixtures, with no special-case branching in production code.
 *
 * See also: src/tools/claude-code/ClaudeCodeTool.ts (ARGV HANDLING comment)
 */
const combinedPromptString = process.argv[2];

if (!combinedPromptString) {
  console.error('ERROR: No prompt string provided. Expected: "<command> <tempDir>"');
  process.exit(1);
}

// Parse the combined string like real Claude does
const [, commandInputOutputFilesDirectory] = combinedPromptString.split(' ');

console.log(`Fake Claude CLI (fake-claude-cli.reverses-a-string-using-files.fixture.ts)`);
console.log(`  Received combined prompt string: "${combinedPromptString}"`);
console.log(`  Parsed tempDir: ${commandInputOutputFilesDirectory}`);
console.log(`  Simulating "reverse-a-string" command...`);

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
