// MCP Server Configuration
export const MCP_CONFIG = {
  servers: {
    espn: {
      url: process.env.NEXT_PUBLIC_ESPN_MCP_URL || 'http://localhost:8000',
      name: 'ESPN Fantasy Football'
    },
    sleeper: {
      url: process.env.NEXT_PUBLIC_SLEEPER_MCP_URL || 'http://localhost:8001',
      name: 'Sleeper Fantasy Football'
    }
  },
  endpoints: {
    tools: '/tools',
    call: '/call'
  }
} as const;

export type ServerType = keyof typeof MCP_CONFIG.servers;
