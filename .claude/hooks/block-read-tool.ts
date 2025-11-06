#!/usr/bin/env bun

// Hook to prevent Claude Code from reading any file

// Read stdin to get the hook input from Claude Code
const input = await Bun.stdin.text();

try {
  const data = JSON.parse(input);
  
  // Check if this is a Read tool request
  if (data.tool_name === 'Read') {
    // Block the Read tool with a clear message
    console.error(`🚫 READ OPERATION BLOCKED: File reading has been disabled by security policy.

The Read tool has been blocked for all files.
This is a security measure to prevent unauthorized file access.

If you need to access files, please disable this hook in .claude/settings.json`);
    
    // Exit code 2 blocks the tool call and shows stderr to Claude
    process.exit(2);
  }
  
  // For non-Read tools, allow them to proceed
  process.exit(0);
  
} catch (error) {
  // On error, allow the tool to proceed anyway (fail-safe)
  console.error(`Hook error: ${error}`);
  process.exit(0);
}
