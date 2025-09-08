import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPToolResult {
  content: unknown;
  isError?: boolean;
}

export class MCPHTTPClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport;
  private connected: boolean = false;

  constructor(baseUrl: string) {
    this.transport = new StreamableHTTPClientTransport(new URL(baseUrl));
    this.client = new Client({
      name: "fantasy-web-client",
      version: "1.0.0",
    }, {
      capabilities: {
        tools: {},
      },
    });
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect(this.transport);
      this.connected = true;
    }
  }

  async callTool(name: string, arguments_: Record<string, unknown> = {}): Promise<MCPToolResult> {
    await this.connect();
    
    try {
      const result = await this.client.callTool({ name, arguments: arguments_ });
      return {
        content: result.content,
        isError: Boolean(result.isError)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: `Error calling tool ${name}: ${errorMessage}`,
        isError: true
      };
    }
  }

  async listTools(): Promise<MCPTool[]> {
    await this.connect();
    
    try {
      const result = await this.client.listTools();
      return result.tools || [];
    } catch (error) {
      console.error('Error listing tools:', error);
      return [];
    }
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
    }
  }
}

// Factory function to create clients for different servers
export function createMCPClient(server: 'espn' | 'sleeper'): MCPHTTPClient {
  const baseUrls = {
    espn: process.env.NEXT_PUBLIC_ESPN_MCP_URL || 'http://localhost:8000',
    sleeper: process.env.NEXT_PUBLIC_SLEEPER_MCP_URL || 'http://localhost:8001'
  };
  
  return new MCPHTTPClient(`${baseUrls[server]}/mcp`);
}
