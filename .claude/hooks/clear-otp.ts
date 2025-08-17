#!/usr/bin/env bun

// Clear OTP after successful tool use
import { existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';

// Read stdin to get the hook input from Claude Code
const input = await Bun.stdin.text();

try {
  const data = JSON.parse(input);
  
  // Get the directory of this script, then go up to project root
  const scriptPath = process.argv[1];
  const hooksDir = dirname(scriptPath);
  const claudeDir = dirname(hooksDir);
  const projectDir = dirname(claudeDir);
  
  // OTP file path
  const otpFile = join(projectDir, 'otp.txt');
  
  // Get the command from the tool input to check if OTP was used
  const command = data.tool_input?.command || '';
  
  // Check if OTP was provided in the command
  const otpMatch = command.match(/^OTP=(\d{6})\s+/);
  
  if (otpMatch && existsSync(otpFile)) {
    // OTP was used, clear it
    unlinkSync(otpFile);
    console.error(`✅ OTP cleared after successful tool use.`);
  }
  
  // Always allow PostToolUse hooks to succeed
  process.exit(0);
  
} catch (error) {
  // On error, still allow to proceed
  process.exit(0);
}