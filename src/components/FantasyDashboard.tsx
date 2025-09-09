'use client';

import { useESPNFantasy, useSleeperFantasy } from '@/hooks/use-mcp';
import { useEffect, useState } from 'react';
import type { MCPTool, MCPToolResult } from '@/lib/mcp-client';
import ChatBot from './ChatBot';

interface ServerSectionProps {
  title: string;
  tools: MCPTool[];
  loading: boolean;
  error: string | null;
  onLoadTools: () => void;
  onCallTool: (toolName: string, args?: Record<string, unknown>) => Promise<MCPToolResult | null>;
  onClearError: () => void;
}

function ServerSection({ title, tools, loading, error, onLoadTools, onCallTool, onClearError }: ServerSectionProps) {
  const [results, setResults] = useState<{ [key: string]: unknown }>({});
  const [activeCall, setActiveCall] = useState<string | null>(null);

  const handleToolCall = async (toolName: string, args: Record<string, unknown> = {}) => {
    setActiveCall(toolName);
    const result = await onCallTool(toolName, args);
    if (result && !result.isError) {
      setResults(prev => ({ ...prev, [toolName]: result.content }));
    }
    setActiveCall(null);
  };

  const isToolActive = (toolName: string) => activeCall === toolName;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <button
          onClick={onLoadTools}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {loading ? 'Loading...' : 'Load Tools'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex justify-between items-start">
            <div className="text-red-700">
              <strong>Error:</strong> {error}
            </div>
            <button
              onClick={onClearError}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Available Tools ({tools.length})</h3>
          <div className="grid gap-3">
            {tools.map((tool) => (
              <div key={tool.name} className="border border-gray-200 rounded-md p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{tool.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{tool.description || 'No description available'}</p>
                  </div>
                  <button
                    onClick={() => handleToolCall(tool.name)}
                    disabled={loading || isToolActive(tool.name)}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-3 py-1 rounded text-sm font-medium transition-colors ml-3"
                  >
                    {isToolActive(tool.name) ? 'Calling...' : 'Call'}
                  </button>
                </div>
                
                {results[tool.name] !== undefined && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border">
                    <h5 className="font-medium text-gray-700 mb-2">Result:</h5>
                    <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                      {JSON.stringify(results[tool.name], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {tools.length === 0 && !loading && (
            <p className="text-gray-500 text-center py-8">
              No tools loaded. Click &quot;Load Tools&quot; to fetch available tools.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FantasyDashboard() {
  const espnMCP = useESPNFantasy();
  const sleeperMCP = useSleeperFantasy();
  const [activeTab, setActiveTab] = useState<'espn' | 'sleeper' | 'chat'>('chat');

  useEffect(() => {
    // Auto-load tools when component mounts
    espnMCP.listTools();
    sleeperMCP.listTools();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Fantasy Football MCP Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Manage your fantasy teams using Model Context Protocol
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AI Assistant
            </button>
            <button
              onClick={() => setActiveTab('espn')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'espn'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ESPN Tools
            </button>
            <button
              onClick={() => setActiveTab('sleeper')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'sleeper'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sleeper Tools
            </button>
          </div>
        </div>

        {/* Server Status */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                espnMCP.tools.length > 0 ? 'bg-green-500' : espnMCP.error ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="font-medium">ESPN Server</span>
              <span className="ml-auto text-sm text-gray-600">
                {espnMCP.tools.length} tools available
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                sleeperMCP.tools.length > 0 ? 'bg-green-500' : sleeperMCP.error ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="font-medium">Sleeper Server</span>
              <span className="ml-auto text-sm text-gray-600">
                {sleeperMCP.tools.length} tools available
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {activeTab === 'chat' && (
            <div className="bg-white rounded-lg shadow-md p-6 h-96">
              <ChatBot 
                className="h-full"
              />
            </div>
          )}
          
          {activeTab === 'espn' && (
            <ServerSection
              title="ESPN Fantasy Football"
              tools={espnMCP.tools}
              loading={espnMCP.loading}
              error={espnMCP.error}
              onLoadTools={espnMCP.listTools}
              onCallTool={espnMCP.callTool}
              onClearError={espnMCP.clearError}
            />
          )}
          
          {activeTab === 'sleeper' && (
            <ServerSection
              title="Sleeper Fantasy Football"
              tools={sleeperMCP.tools}
              loading={sleeperMCP.loading}
              error={sleeperMCP.error}
              onLoadTools={sleeperMCP.listTools}
              onCallTool={sleeperMCP.callTool}
              onClearError={sleeperMCP.clearError}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeTab === 'espn' && (
              <>
                <button
                  onClick={() => espnMCP.getRoster()}
                  disabled={espnMCP.loading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-3 rounded-md font-medium transition-colors"
                >
                  Get My Roster
                </button>
                <button
                  onClick={() => espnMCP.getMatchups()}
                  disabled={espnMCP.loading}
                  className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-3 rounded-md font-medium transition-colors"
                >
                  Get Matchups
                </button>
                <button
                  onClick={() => espnMCP.getLeagueTeams()}
                  disabled={espnMCP.loading}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-3 rounded-md font-medium transition-colors"
                >
                  League Teams
                </button>
                <button
                  onClick={() => espnMCP.getFreeAgents()}
                  disabled={espnMCP.loading}
                  className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-3 rounded-md font-medium transition-colors"
                >
                  Free Agents
                </button>
              </>
            )}
            
            {activeTab === 'sleeper' && (
              <>
                <button
                  onClick={() => sleeperMCP.getAllPlayers()}
                  disabled={sleeperMCP.loading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-3 rounded-md font-medium transition-colors"
                >
                  All Players
                </button>
                <button
                  onClick={() => sleeperMCP.getUser('your_username')}
                  disabled={sleeperMCP.loading}
                  className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-3 rounded-md font-medium transition-colors"
                >
                  Get User
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
