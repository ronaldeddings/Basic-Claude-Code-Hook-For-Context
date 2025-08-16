# Claude Code Hooks Examples

A practical guide to using Claude Code hooks effectively.

## Overview

This repository demonstrates how to implement and use all the Claude Code hook events to customize and control Claude's behavior in your development workflow.

## What are Claude Code Hooks?

Claude Code hooks are user-defined shell commands that execute at specific points in Claude Code's lifecycle. They provide deterministic control over Claude's behavior, ensuring certain actions always happen rather than relying on the LLM to choose to run them.

## Hook Events

This repo includes examples for all available hook events:

- **PreToolUse** - Runs before tool calls (can block them)
- **PostToolUse** - Runs after tool calls complete  
- **Notification** - Runs when Claude Code sends notifications
- **UserPromptSubmit** - Runs when user submits a prompt
- **Stop** - Runs when Claude Code finishes responding
- **SubagentStop** - Runs when subagent tasks complete
- **PreCompact** - Runs before context compaction
- **SessionStart** - Runs when starting/resuming sessions

## Current Examples

### 1. Block npm run dev (PreToolUse)

Located in `.claude/hooks/block-npm-dev.ts`, this TypeScript hook prevents Claude from running `npm run dev` by:
- Intercepting all Bash commands before execution
- Checking if the command contains "npm run dev"
- Blocking execution with exit code 2 and providing feedback to Claude

### 2. User Prompt Context (UserPromptSubmit)

The settings include a simple echo command that demonstrates the UserPromptSubmit hook.

## Setup

1. Clone this repository
2. Make sure you have Bun installed (for TypeScript hooks)
3. Review `.claude/settings.json` to see the hook configurations
4. Customize the hooks for your needs

## Security Note

Hooks execute with your system credentials. Always review hook commands before using them, as they can modify or access any files your user account can access.

## Resources

- [Claude Code Hooks Guide](https://docs.anthropic.com/en/docs/claude-code/hooks-guide)
- [Claude Code Hooks Reference](https://docs.anthropic.com/en/docs/claude-code/hooks)

## Contributing

Feel free to add more hook examples by submitting a PR!