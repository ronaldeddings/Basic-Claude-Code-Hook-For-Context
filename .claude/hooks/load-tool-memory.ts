#!/usr/bin/env bun

// OTP-based lock mechanism to ensure Claude reads tool-memory.txt
import { readFileSync, existsSync, writeFileSync } from 'fs';
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
  
  // Get the command from the tool input
  const command = data.tool_input?.command || '';
  const filePath = data.tool_input?.file_path || '';
  
  // Check if OTP was provided in the command (as environment variable)
  const otpMatch = command.match(/^OTP=(\d{6})\s+/);
  
  if (otpMatch) {
    // OTP was provided, verify it
    const providedOtp = otpMatch[1];
    
    if (existsSync(otpFile)) {
      const storedOtp = readFileSync(otpFile, 'utf-8').trim();
      
      if (storedOtp === providedOtp) {
        // OTP matches! Allow the tool to proceed
        // The PostToolUse hook will clear the OTP
        process.exit(0);
      } else {
        // Wrong OTP
        console.error(`❌ Invalid OTP. Please check the OTP and try again.`);
        process.exit(2);
      }
    } else {
      // No OTP file exists but OTP was provided
      console.error(`❌ No OTP was requested. Please try without OTP.`);
      process.exit(2);
    }
  } else {
    // No OTP provided, check if we should request one
    
    // Read the tool-memory.txt file
    const toolMemoryPath = join(projectDir, 'tool-memory.txt');
    
    if (existsSync(toolMemoryPath)) {
      const toolMemoryContent = readFileSync(toolMemoryPath, 'utf-8').trim();
      
      if (toolMemoryContent) {
        // Generate a random 6-digit OTP
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store the OTP
        writeFileSync(otpFile, newOtp);
        
        // Block the tool and show instructions
        console.error(`📝 TOOL MEMORY - MUST READ AND ACKNOWLEDGE:
${toolMemoryContent}

🔐 ACKNOWLEDGMENT REQUIRED:
To confirm you've read and will follow the above instructions, retry the command with:
OTP=${newOtp} [your command]

Example: OTP=${newOtp} ${command || 'python -c "print(1)"'}`);
        process.exit(2);
      }
    }
    
    // No tool-memory.txt or it's empty, allow the tool to proceed
    process.exit(0);
  }
  
} catch (error) {
  // On error, allow the tool to proceed anyway
  console.error(`Hook error: ${error}`);
  process.exit(0);
}