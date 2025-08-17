#!/usr/bin/env bun

// Hook to prevent database deletion operations in Supabase/PostgreSQL
// This hook blocks dangerous commands that could delete data from your database

// Make this a module to support top-level await
export {};

// Read stdin to get the hook input from Claude Code
const input = await Bun.stdin.text();

try {
  const data = JSON.parse(input);
  
  // Get the tool name and relevant input
  const toolName = data.tool_name || "";
  const toolInput = data.tool_input || {};
  
  // Define dangerous database operations patterns
  const dangerousPatterns = [
    // Supabase CLI commands
    /\bsupabase\s+db\s+reset\b/i,
    /\bsupabase\s+postgres-config\s+delete\b/i,
    /\bsupabase\s+branches?\s+(delete|reset)\b/i,
    
    // PostgreSQL DELETE operations
    /\bDELETE\s+FROM\b/i,
    /\bDELETE\s+WHERE\b/i,
    
    // TRUNCATE operations (removes all rows)
    /\bTRUNCATE\s+(TABLE\s+)?\w+/i,
    
    // DROP operations (removes entire objects)
    /\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW|SEQUENCE|FUNCTION|TRIGGER|TYPE|ROLE|USER)\b/i,
    /\bDROP\s+.*\s+CASCADE\b/i,
    
    // CASCADE operations
    /\bCASCADE\b.*\b(DELETE|DROP|TRUNCATE)\b/i,
    /\b(DELETE|DROP|TRUNCATE)\b.*\bCASCADE\b/i,
    
    // ALTER TABLE operations that drop columns
    /\bALTER\s+TABLE\s+.*\s+DROP\s+(COLUMN|CONSTRAINT)\b/i,
    
    // Dangerous psql meta-commands
    /\\drop\b/i,
    
    // Database reset/clean operations
    /\b(reset|clean|clear|purge|wipe|destroy).*\b(database|db|data|table)\b/i,
    /\b(database|db|data|table).*\b(reset|clean|clear|purge|wipe|destroy)\b/i,
  ];
  
  // Check different tool types for dangerous operations
  let contentToCheck = "";
  let contextMessage = "";
  
  switch (toolName) {
    case "Bash":
      // Check bash commands
      contentToCheck = toolInput.command || "";
      contextMessage = "bash command";
      break;
      
    case "Write":
    case "Edit":
    case "MultiEdit":
      // Check file content for SQL files
      const filePath = toolInput.file_path || "";
      const content = toolInput.content || toolInput.new_string || "";
      
      // Only check SQL-related files
      if (filePath.match(/\.(sql|psql|pgsql|ddl|dml)$/i) || 
          filePath.includes("migration") ||
          filePath.includes("schema")) {
        contentToCheck = content;
        contextMessage = `SQL file (${filePath})`;
      }
      break;
      
    default:
      // Check MCP database tools
      if (toolName.match(/^mcp__(supabase|postgres|database|sql)/i)) {
        // Check all string values in tool_input
        contentToCheck = JSON.stringify(toolInput);
        contextMessage = `MCP database tool (${toolName})`;
      }
  }
  
  // If there's content to check, validate it
  if (contentToCheck) {
    for (const pattern of dangerousPatterns) {
      if (pattern.test(contentToCheck)) {
        // Extract the matched dangerous operation for better feedback
        const match = contentToCheck.match(pattern);
        const operation = match ? match[0].substring(0, 50) : "database deletion operation";
        
        // Provide detailed feedback to Claude about why this was blocked
        const errorMessage = [
          "🛡️ DATABASE PROTECTION: Operation blocked for safety",
          "",
          `Detected dangerous operation in ${contextMessage}:`,
          `  "${operation}..."`,
          "",
          "This operation could potentially:",
          "  • Delete data from the database",
          "  • Remove database objects (tables, schemas, etc.)",
          "  • Reset or truncate tables",
          "  • Cascade delete related data",
          "",
          "Alternatives to consider:",
          "  1. Use SELECT to query data without modification",
          "  2. Create a backup before destructive operations",
          "  3. Use transactions with ROLLBACK for testing",
          "  4. Work with a development/test database instead",
          "  5. Ask the user for explicit permission to proceed",
          "",
          "If this operation is truly needed, the user can:",
          "  • Temporarily disable this hook in .claude/settings.json",
          "  • Run the command directly outside of Claude Code",
          "  • Modify the hook to allow specific safe patterns"
        ].join("\n");
        
        // Exit code 2 blocks the tool call and shows stderr to Claude
        console.error(errorMessage);
        process.exit(2);
      }
    }
  }
  
  // Additional check for SQL keywords in any tool input
  if (toolName === "Bash" || toolName.startsWith("mcp__")) {
    const sqlKeywords = /\b(DELETE|TRUNCATE|DROP)\s+(FROM|TABLE|DATABASE|SCHEMA)\b/i;
    const commandStr = JSON.stringify(toolInput).toLowerCase();
    
    if (sqlKeywords.test(commandStr)) {
      console.error([
        "⚠️ POTENTIAL DATABASE OPERATION DETECTED",
        "",
        "This command appears to contain SQL deletion keywords.",
        "Please ensure you're not performing destructive database operations.",
        "",
        "If you need to work with the database, consider:",
        "  • Using read-only operations (SELECT)",
        "  • Working in a transaction that can be rolled back",
        "  • Using a development database",
        "  • Getting explicit user permission first"
      ].join("\n"));
      
      // Exit code 2 to block
      process.exit(2);
    }
  }
  
  // Log database-related operations for audit (optional)
  if (toolName === "Bash" || toolName.startsWith("mcp__")) {
    const dbKeywords = /\b(supabase|psql|postgres|sql|database|db)\b/i;
    if (dbKeywords.test(JSON.stringify(toolInput))) {
      // Could log to a file for audit purposes (non-blocking)
      // const logEntry = {
      //   timestamp: new Date().toISOString(),
      //   tool: toolName,
      //   command: toolInput.command || toolInput,
      //   allowed: true
      // };
      
      // You could write to a log file here if needed
      // For now, just allow it to proceed
    }
  }
  
  // Allow all other operations
  process.exit(0);
  
} catch (error) {
  console.error(`Error in database protection hook: ${error}`);
  // On error, fail open (allow the operation) to not break Claude Code
  process.exit(0);
}