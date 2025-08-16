#!/usr/bin/env bun

// Read stdin to get the hook input from Claude Code
const input = await Bun.stdin.text();

try {
  const data = JSON.parse(input);
  
  // Get the tool name and command
  const toolName = data.tool_name || "";
  const command = data.tool_input?.command || "";
  
  // Only check Bash commands
  if (toolName !== "Bash") {
    process.exit(0);
  }
  
  // Check if the command contains "npm run dev"
  if (command.includes("npm run dev")) {
    // Exit code 2 blocks the tool call and shows stderr to Claude
    console.error("❌ BLOCKED: 'npm run dev' is not allowed. Please use a different command or ask the user for an alternative way to start the development server.");
    process.exit(2);
  }
  
  // Allow all other commands
  process.exit(0);
  
} catch (error) {
  console.error(`Error parsing JSON input: ${error}`);
  process.exit(1);
}