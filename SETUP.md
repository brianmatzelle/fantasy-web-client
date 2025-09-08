# Fantasy MCP Web Client Setup

This Next.js application provides a web interface for interacting with your Fantasy Football MCP servers.

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the web directory:

```bash
# MCP Server URLs
NEXT_PUBLIC_ESPN_MCP_URL=http://localhost:8000
NEXT_PUBLIC_SLEEPER_MCP_URL=http://localhost:8001
```

### 2. Start Your MCP Servers

**ESPN Server:**
```bash
cd ../espn-server
uv run server.py --port 8000
```

**Sleeper Server:**
```bash
cd ../sleeper-server
uv run main.py --port 8001
```

### 3. Start the Web Client

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### 🏈 ESPN Fantasy Football
- Get roster information
- View matchups and league teams
- Access free agents
- Execute trades and waiver claims
- Get player news and stats

### 🏈 Sleeper Fantasy Football
- User management
- League information
- Player data
- Draft management

### 🔧 Developer Features
- **Stateless HTTP**: Each request is independent
- **Real-time tool execution**: Call MCP tools directly from the UI
- **Error handling**: Clear error messages and recovery
- **Responsive design**: Works on desktop and mobile

## Architecture

```
Next.js Frontend
    ↓ API Routes (/api/mcp/[server]/[action])
    ↓ HTTP Requests
MCP Servers (ESPN/Sleeper)
```

### Key Components

1. **MCP Client** (`src/lib/mcp-client.ts`)
   - HTTP transport for MCP communication
   - Tool calling and listing functionality

2. **React Hooks** (`src/hooks/use-mcp.ts`)
   - `useMCP()` - Generic MCP server interaction
   - `useESPNFantasy()` - ESPN-specific operations
   - `useSleeperFantasy()` - Sleeper-specific operations

3. **API Routes** (`src/app/api/mcp/[server]/[action]/route.ts`)
   - `/api/mcp/espn/tools` - List ESPN tools
   - `/api/mcp/espn/call` - Call ESPN tools
   - `/api/mcp/sleeper/tools` - List Sleeper tools
   - `/api/mcp/sleeper/call` - Call Sleeper tools

4. **Dashboard** (`src/components/FantasyDashboard.tsx`)
   - Tool browser and executor
   - Server status monitoring
   - Quick actions for common operations

## Development

### Adding New Servers

1. Update `MCP_CONFIG` in `src/config/mcp.ts`
2. Add server URL to environment variables
3. Create specialized hook in `src/hooks/use-mcp.ts`
4. Add tab in dashboard component

### Troubleshooting

**"Failed to fetch tools"**
- Ensure MCP server is running on the correct port
- Check server logs for errors
- Verify CORS settings if needed

**"Network error"**
- Check that server URLs in `.env.local` are correct
- Ensure servers are accessible from the web client

**"Tool call failed"**
- Check MCP server logs for tool execution errors
- Verify tool parameters match the expected schema

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Environment Variables for Production
```bash
NEXT_PUBLIC_ESPN_MCP_URL=https://your-espn-server.com
NEXT_PUBLIC_SLEEPER_MCP_URL=https://your-sleeper-server.com
```
