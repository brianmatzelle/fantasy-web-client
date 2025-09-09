// MCP Server Configuration
export const MCP_CONFIG = {
  servers: {
    espn: {
      url: process.env.NEXT_PUBLIC_ESPN_MCP_URL || 'https://api.poop.football',
      name: 'ESPN Fantasy Football'
    }
  },
  endpoints: {
    tools: '/tools',
    call: '/call'
  }
} as const;

export type ServerType = keyof typeof MCP_CONFIG.servers;
