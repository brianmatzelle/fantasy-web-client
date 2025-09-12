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

Help users with:
- Roster management and lineup optimization
- Player analysis and recommendations  
- Waiver wire and free agent suggestions
- Trade analysis and proposals
- Matchup insights and strategy
- League standings and power rankings
- Player news and injury updates

Always use the available MCP tools to get real-time data when answering questions. Be conversational, helpful, and provide actionable fantasy football advice.

When using tools, make sure to interpret the results and provide helpful analysis rather than just showing raw data.`;

    const toolCalls: string[] = [];
    let response = '';

    try {
      // Make initial request to Claude
      const result = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages,
        tools: availableTools,
        tool_choice: { type: 'auto' }
      });

      const currentMessages = [...messages];
      let currentResult = result;

      // Handle tool calls in a loop (up to 5 iterations to prevent infinite loops)
      for (let iteration = 0; iteration < 5; iteration++) {
        if (currentResult.content.some(block => block.type === 'tool_use')) {
          // Execute tool calls
          const toolResults = [];
          
          for (const block of currentResult.content) {
            if (block.type === 'tool_use') {
              toolCalls.push(`${block.name}(${JSON.stringify(block.input)})`);
              
              try {
                console.log(`Calling MCP tool: ${block.name} with args:`, block.input);
                const toolArgs = block.input as Record<string, unknown>;
                const toolResult = await mcpClient.callTool(block.name, toolArgs);
                
                toolResults.push({
                  type: 'tool_result' as const,
                  tool_use_id: block.id,
                  content: toolResult.isError ? 
                    `Error: ${toolResult.content}` : 
                    JSON.stringify(toolResult.content, null, 2)
                });
              } catch (error) {
                console.error(`Error calling tool ${block.name}:`, error);
                toolResults.push({
                  type: 'tool_result' as const,
                  tool_use_id: block.id,
                  content: `Error calling ${block.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
              }
            }
          }

          // Add assistant message and tool results to conversation
          currentMessages.push({
            role: 'assistant',
            content: currentResult.content
          });

          if (toolResults.length > 0) {
            currentMessages.push({
              role: 'user',
              content: toolResults
            });

            // Continue conversation with tool results
            currentResult = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4000,
              system: systemPrompt,
              messages: currentMessages,
              tools: availableTools,
              tool_choice: { type: 'auto' }
            });
          } else {
            break;
          }
        } else {
          // No more tool calls, we're done
          break;
        }
      }

      // Extract final response text
      response = currentResult.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

    } finally {
      await mcpClient.close();
    }

    return NextResponse.json({
      response,
      toolCalls,
      success: true,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: response }
      ]
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
