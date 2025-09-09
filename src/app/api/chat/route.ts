import { query } from '@anthropic-ai/claude-code';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check for Anthropic API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    const abortController = new AbortController();
    
    // Set up a timeout to prevent hanging requests
    const timeout = setTimeout(() => {
      abortController.abort();
    }, 60000); // 60 second timeout

    try {
      let fullResponse = '';
      let currentSessionId = sessionId;
      const toolCalls: string[] = [];

      // Use Claude Code SDK with MCP server configuration
      for await (const response of query({
        prompt: message,
        options: {
          abortController,
          maxTurns: 5,
          customSystemPrompt: `You are an expert fantasy football assistant with access to ESPN Fantasy Football data through MCP tools. 
          
Help users with:
- Roster management and lineup optimization
- Player analysis and recommendations  
- Waiver wire and free agent suggestions
- Trade analysis and proposals
- Matchup insights and strategy
- League standings and power rankings
- Player news and injury updates

Always use the available MCP tools to get real-time data when answering questions. Be conversational, helpful, and provide actionable fantasy football advice.`,
          
          // Configure the remote MCP server using URL
          mcpServers: {
            "espn-fantasy": {
              type: "http",
              url: "https://api.poop.football/mcp"
            }
          },
          
          // Continue conversation if we have a session
          ...(currentSessionId ? { resume: currentSessionId } : {}),
          
          // Allow ESPN fantasy tools (using actual tool names from the server)
          allowedTools: [
            "Read", "Grep", "WebSearch",
            "mcp__espn-fantasy__change_lineup",
            "mcp__espn-fantasy__get_lineup_slot_reference",
            "mcp__espn-fantasy__get_roster",
            "mcp__espn-fantasy__get_free_agents",
            "mcp__espn-fantasy__get_player_stats",
            "mcp__espn-fantasy__get_live_player_stats",
            "mcp__espn-fantasy__get_league_teams",
            "mcp__espn-fantasy__get_matchups",
            "mcp__espn-fantasy__get_live_matchups",
            "mcp__espn-fantasy__get_power_rankings",
            "mcp__espn-fantasy__get_recent_transactions",
            "mcp__espn-fantasy__get_positional_rankings",
            "mcp__espn-fantasy__get_server_config",
            "mcp__espn-fantasy__claim_waiver_player",
            "mcp__espn-fantasy__pickup_free_agent",
            "mcp__espn-fantasy__drop_roster_player",
            "mcp__espn-fantasy__propose_trade_offer",
            "mcp__espn-fantasy__accept_trade_proposal",
            "mcp__espn-fantasy__decline_trade_proposal",
            "mcp__espn-fantasy__cancel_trade_proposal",
            "mcp__espn-fantasy__get_pending_trades",
            "mcp__espn-fantasy__move_player_to_ir",
            "mcp__espn-fantasy__move_player_from_ir",
            "mcp__espn-fantasy__get_ir_eligible_players",
            "mcp__espn-fantasy__get_player_news",
            "mcp__espn-fantasy__get_nfl_news",
            "mcp__espn-fantasy__get_fantasy_news",
            "mcp__espn-fantasy__get_draft_recap",
            "mcp__espn-fantasy__get_draft_results",
            "mcp__espn-fantasy__draft_strategy_analysis",
            "mcp__espn-fantasy__get_league_messages",
            "mcp__espn-fantasy__get_historical_standings",
            "mcp__espn-fantasy__get_season_records",
            "mcp__espn-fantasy__get_weekly_roster_analysis"
          ]
        }
      })) {
        
        // Handle different message types
        if (response.type === 'system' && response.subtype === 'init') {
          currentSessionId = response.session_id;
        }
        
        if (response.type === 'assistant') {
          const content = response.message.content;
          if (Array.isArray(content)) {
            // Look for tool use blocks to track what tools were called
            content.forEach(block => {
              if (block.type === 'tool_use') {
                toolCalls.push(`${block.name}(${JSON.stringify(block.input)})`);
              }
            });
            
            const textContent = content
              .filter(c => c.type === 'text')
              .map(c => c.text)
              .join('');
            
            fullResponse += textContent;
          }
        }
        
        if (response.type === 'result') {
          // Final result
          clearTimeout(timeout);
          
          const isSuccess = response.subtype === 'success';
          
          return NextResponse.json({
            response: isSuccess ? (response as { result: string }).result : fullResponse,
            sessionId: currentSessionId,
            toolCalls,
            success: isSuccess,
            error: response.subtype?.startsWith('error') ? 
              `Conversation ${response.subtype.replace('error_', '')}` : null,
            metadata: {
              duration_ms: response.duration_ms,
              num_turns: response.num_turns,
              total_cost_usd: response.total_cost_usd
            }
          });
        }
      }

      // If we get here without a result, something went wrong
      clearTimeout(timeout);
      return NextResponse.json({
        response: fullResponse || 'No response generated',
        sessionId: currentSessionId,
        toolCalls,
        success: false,
        error: 'Incomplete response'
      });

    } catch (queryError) {
      clearTimeout(timeout);
      
      if (queryError instanceof Error && queryError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out' },
          { status: 408 }
        );
      }
      
      throw queryError;
    }

  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: `Chat processing failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
