import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createMCPClient } from '@/lib/mcp-client';

// Initialize Anthropic client
function createAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// Function to dynamically fetch available tools from MCP server
async function getAvailableTools(mcpClient: ReturnType<typeof createMCPClient>): Promise<Anthropic.Tool[]> {
  try {
    const mcpTools = await mcpClient.listTools();
    
    // Convert MCP tools to Anthropic tool format
    return mcpTools.map(tool => ({
      name: tool.name,
      description: tool.description || `Execute ${tool.name} tool`,
      input_schema: tool.inputSchema as Anthropic.Tool.InputSchema
    }));
  } catch (error) {
    console.error('Error fetching tools from MCP server:', error);
    
    // Fallback to basic tools if MCP server is unavailable
    return [
      {
        name: "get_roster",
        description: "Get the current roster for your fantasy team",
        input_schema: {
          type: "object" as const,
          properties: {
            team_id: { type: "number", description: "Team ID (optional, defaults to your team)" }
          }
        }
      },
      {
        name: "get_matchups", 
        description: "Get fantasy matchups with live scores",
        input_schema: {
          type: "object" as const,
          properties: {
            week: { type: "number", description: "NFL week number (optional)" }
          }
        }
      },
      {
        name: "get_league_teams",
        description: "Get all teams in your fantasy league with standings",
        input_schema: { type: "object" as const, properties: {} }
      }
    ];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const anthropic = createAnthropicClient();
    const mcpClient = createMCPClient('espn');
    
    // Fetch available tools dynamically from MCP server
    const availableTools = await getAvailableTools(mcpClient);

    // Build conversation messages
    const messages: Anthropic.Messages.MessageParam[] = [
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    const systemPrompt = `You are an expert fantasy football assistant with access to ESPN Fantasy Football data through MCP tools.

## CORE RESPONSIBILITIES
Help users with:
- Roster management and lineup optimization
- Player analysis and recommendations  
- Waiver wire and free agent suggestions
- Trade analysis and proposals
- Matchup insights and strategy
- League standings and power rankings
- Player news and injury updates

## CRITICAL FANTASY FOOTBALL RULES
**LINEUP LOCK RULES - EXTREMELY IMPORTANT:**
- Once a player's game has started, they CANNOT be moved between starting lineup and bench
- Players who have already scored points (non-zero scores) have likely already played and are LOCKED
- You can only suggest lineup changes for players whose games have NOT yet started
- Always check if a player has already played before suggesting lineup moves
- If suggesting a player move from bench to starting lineup, first verify their game hasn't started

**SCORING & TIMING:**
- Players with points > 0 have likely already played their game this week
- Thursday night games lock those players first
- Sunday/Monday games lock later
- Always consider game timing when making recommendations

**ROSTER CONSTRAINTS:**
- Starting lineups have position limits (QB, RB, WR, TE, FLEX, K, D/ST)
- FLEX can be RB, WR, or TE
- Bench players can only replace starters if their games haven't started

## TOOL USAGE GUIDELINES
Always use the available MCP tools to get real-time data when answering questions. Be conversational, helpful, and provide actionable fantasy football advice.

When using tools, make sure to interpret the results and provide helpful analysis rather than just showing raw data.

## RESPONSE APPROACH
1. Gather current data using tools
2. Analyze what changes are actually possible (considering game timing)
3. Provide realistic, actionable recommendations
4. Explain why certain moves aren't possible if games have started`;

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (type: string, data: Record<string, unknown>) => {
          const eventData = `data: ${JSON.stringify({ type, data })}\n\n`;
          controller.enqueue(encoder.encode(eventData));
        };

        try {
          let conversationMessages = [...messages];
          
          // Handle tool calls in a loop (up to 100 iterations to prevent infinite loops)
          // TODO: MAKE THE TOOL CALL LIMIT DEPENDENT ON THE USER'S SUBSCRIPTION
          for (let iteration = 0; iteration < 100; iteration++) {
            // Make streaming request to Claude
            const stream = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4000,
              system: systemPrompt,
              messages: conversationMessages,
              tools: availableTools,
              tool_choice: { type: 'auto' },
              stream: true
            });

            let hasToolUse = false;
            let currentContent: Anthropic.Messages.ContentBlockParam[] = [];
            
            // Process streaming response
            for await (const messageStreamEvent of stream) {
              if (messageStreamEvent.type === 'content_block_start') {
                if (messageStreamEvent.content_block.type === 'text') {
                  sendEvent('text_start', { 
                    index: messageStreamEvent.index 
                  });
                } else if (messageStreamEvent.content_block.type === 'tool_use') {
                  hasToolUse = true;
                  sendEvent('tool_use_start', {
                    index: messageStreamEvent.index,
                    tool: {
                      id: messageStreamEvent.content_block.id,
                      name: messageStreamEvent.content_block.name,
                      input: messageStreamEvent.content_block.input
                    }
                  });
                  currentContent.push(messageStreamEvent.content_block);
                }
              } else if (messageStreamEvent.type === 'content_block_delta') {
                if (messageStreamEvent.delta.type === 'text_delta') {
                  sendEvent('text_delta', {
                    index: messageStreamEvent.index,
                    text: messageStreamEvent.delta.text
                  });
                } else if (messageStreamEvent.delta.type === 'input_json_delta') {
                  sendEvent('tool_input_delta', {
                    index: messageStreamEvent.index,
                    partial_json: messageStreamEvent.delta.partial_json
                  });
                }
              } else if (messageStreamEvent.type === 'content_block_stop') {
                if (messageStreamEvent.index < currentContent.length && 
                    currentContent[messageStreamEvent.index]?.type === 'text') {
                  sendEvent('text_stop', { index: messageStreamEvent.index });
                } else {
                  sendEvent('tool_use_stop', { index: messageStreamEvent.index });
                }
              } else if (messageStreamEvent.type === 'message_start') {
                currentContent = [];
              } else if (messageStreamEvent.type === 'message_delta') {
                // Handle message-level updates if needed
              } else if (messageStreamEvent.type === 'message_stop') {
                // Message completed
                break;
              }
            }

            // If there were tool uses, execute them
            if (hasToolUse) {
              const toolResults = [];
              
              for (const block of currentContent) {
                if (block.type === 'tool_use' && block.id && block.name) {
                  sendEvent('tool_execution_start', {
                    tool_name: block.name,
                    tool_id: block.id
                  });
                  
                  try {
                    console.log(`Calling MCP tool: ${block.name} with args:`, block.input);
                    const toolArgs = block.input as Record<string, unknown>;
                    const toolResult = await mcpClient.callTool(block.name, toolArgs);
                    
                    sendEvent('tool_execution_complete', {
                      tool_name: block.name,
                      tool_id: block.id,
                      success: !toolResult.isError
                    });
                    
                    toolResults.push({
                      type: 'tool_result' as const,
                      tool_use_id: block.id,
                      content: toolResult.isError ? 
                        `Error: ${toolResult.content}` : 
                        JSON.stringify(toolResult.content, null, 2)
                    });
                  } catch (error) {
                    console.error(`Error calling tool ${block.name}:`, error);
                    
                    sendEvent('tool_execution_error', {
                      tool_name: block.name,
                      tool_id: block.id,
                      error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    
                    toolResults.push({
                      type: 'tool_result' as const,
                      tool_use_id: block.id,
                      content: `Error calling ${block.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                    });
                  }
                }
              }

              // Add assistant message and tool results to conversation
              conversationMessages = [
                ...conversationMessages,
                {
                  role: 'assistant',
                  content: currentContent
                }
              ];

              if (toolResults.length > 0) {
                conversationMessages = [
                  ...conversationMessages,
                  {
                    role: 'user',
                    content: toolResults
                  }
                ];
                
                // Continue with next iteration to get the final response
                continue;
              } else {
                break;
              }
            } else {
              // No tool use, we're done
              break;
            }
          }

          sendEvent('complete', {});
          controller.close();

        } catch (error) {
          console.error('Streaming error:', error);
          sendEvent('error', {
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
          controller.close();
        } finally {
          await mcpClient.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

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
