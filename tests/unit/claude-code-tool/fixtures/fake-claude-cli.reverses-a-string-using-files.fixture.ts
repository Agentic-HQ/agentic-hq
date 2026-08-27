#!/usr/bin/env tsx
/**
 * Fake Claude CLI Fixture for Unit Testing File I/O
 *
 * Simulates what a real Claude CLI would do when running the "reverse-a-string"
 * command: reading command-input.json, reversing the string, and writing the result to command-output.json.
 * This is TEST SCAFFOLDING - it replaces real Claude in unit tests.
 *
 * USAGE: tsx fake-claude-cli.reverses-a-string-using-files.fixture.ts [--plugin-dir=...] '<command> "<tempDir>"'
 *
 * Uses Commander for argument parsing, just like the real Claude CLI handles flags
 * (e.g. --plugin-dir) separately from the positional prompt/command argument.
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

import { Command } from 'commander';

/*
 * ARGUMENT PARSING - REPLICATING REAL CLAUDE CLI BEHAVIOR
 *
 * Real Claude CLI uses Commander (or similar) to parse flags like --plugin-dir
 * separately from the positional prompt string. For example:
 *
 *   claude --plugin-dir="./plugins/my-plugin" "/reverse-a-string /path/to/temp/dir"
 *
 * Commander handles this automatically:
 * - --plugin-dir is parsed as an option (ignored by this fake CLI)
 * - The remaining positional argument is the combined command+tempDir string
 *
 * This fake CLI uses Commander the same way, so it works regardless of what
 * flags ClaudeCommandBuilder adds (--plugin-dir, etc.) without manual argv parsing.
 */
const program = new Command();
program
  .allowUnknownOption() // Accept any flags (--plugin-dir, etc.) without erroring
  .allowExcessArguments(true) // Don't error on extra positional args
  .argument('[prompt...]', 'Combined command and tempDir string: "<command> <tempDir>"')
  .parse();

// Find the positional argument that isn't a flag — this is the command string,
// just like real Claude CLI picks out the prompt from among its flags.
const combinedPromptString = program.args.find((arg) => !arg.startsWith('--'));

if (!combinedPromptString) {
  console.error('ERROR: No prompt string provided. Expected: "<command> <tempDir>"');
  process.exit(1);
}

// Parse the combined string like real Claude does: everything after the first
// space is the io-directory, double-quoted since AHQ-211 D5 (Windows paths can
// contain spaces, so a plain space-split would truncate it) — strip the quotes
const firstSpaceIndex = combinedPromptString.indexOf(' ');
const rawDirectoryArgument =
  firstSpaceIndex === -1 ? '' : combinedPromptString.slice(firstSpaceIndex + 1);
const commandInputOutputFilesDirectory = rawDirectoryArgument.replace(/^"|"$/g, '');

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
