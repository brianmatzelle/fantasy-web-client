# Vercel Deployment Changes

This document outlines the changes made to enable deployment on Vercel by removing the dependency on `@anthropic-ai/claude-code` which doesn't work in serverless environments.

## Changes Made

### 1. Removed Claude Code Dependency
- **Issue**: `@anthropic-ai/claude-code` doesn't work in Vercel's serverless environment
- **Solution**: Replaced with direct `@anthropic-ai/sdk` usage and existing MCP TypeScript SDK

### 2. Updated Chat API Route (`/src/app/api/chat/route.ts`)
- **Before**: Used `@anthropic-ai/claude-code` query function
- **After**: Direct Anthropic SDK with manual tool calling loop
- **Key Changes**:
  - Uses `@anthropic-ai/sdk` for Claude API calls
  - Integrates with existing `MCPHTTPClient` from `@/lib/mcp-client`
  - Implements manual tool calling loop (up to 5 iterations)
  - Proper TypeScript typing for tool schemas
  - Conversation history management instead of session IDs

### 3. Updated ChatBot Component (`/src/components/ChatBot.tsx`)
- **Before**: Used `sessionId` for conversation continuity
- **After**: Uses `conversationHistory` array approach
- **Key Changes**:
  - Replaced `sessionId` state with `conversationHistory`
  - Updated API call to send conversation history
  - Maintains conversation context between messages

### 4. MCP Client Integration
- **Existing**: Already had working `MCPHTTPClient` using `@modelcontextprotocol/sdk`
- **Integration**: Chat API now uses this existing client for tool calls
- **Benefits**: Consistent MCP communication across the application

## Technical Details

### Tool Calling Flow
1. User sends message to `/api/chat`
2. Claude API called with available tools and conversation history
3. If Claude wants to use tools:
   - Extract tool calls from Claude's response
   - Execute tools via `MCPHTTPClient`
   - Send tool results back to Claude
   - Repeat until Claude provides final response (max 5 iterations)
4. Return final response to frontend

### Available Tools
The chat API includes 10 main fantasy football tools:
- `get_roster` - Get current roster
- `get_matchups` - Get fantasy matchups
- `get_league_teams` - Get all league teams
- `get_free_agents` - Get available free agents
- `get_player_stats` - Get player statistics
- `get_live_player_stats` - Get live player stats
- `get_power_rankings` - Get team power rankings
- `get_positional_rankings` - Get positional matchup rankings
- `get_recent_transactions` - Get league transactions
- `change_lineup` - Move players between positions

### Environment Variables Required
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `NEXT_PUBLIC_ESPN_MCP_URL` - URL to your ESPN MCP server (defaults to localhost:8000)
- `NEXT_PUBLIC_SLEEPER_MCP_URL` - URL to your Sleeper MCP server (defaults to localhost:8001)

## Deployment Ready
✅ **Vercel Compatible**: No longer uses `@anthropic-ai/claude-code`  
✅ **TypeScript Safe**: All types properly defined  
✅ **Build Successful**: Passes Next.js build process  
✅ **MCP Integration**: Uses existing TypeScript SDK  
✅ **Tool Calling**: Full fantasy football tool support  

The application is now ready for deployment on Vercel or any other serverless platform.
