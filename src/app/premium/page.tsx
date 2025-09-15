'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PremiumPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1014]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#697565] to-[#697565]/70 flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-2xl">⭐</span>
          </div>
          <p className="text-[#C4B8A8]/80">Loading...</p>
        </div>
      </div>
    );
  }

  if (!['admin', 'premium'].includes(session?.user?.role || '')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1014]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-500/10 flex items-center justify-center">
            <span className="text-2xl">⭐</span>
          </div>
          <h1 className="text-2xl font-bold text-[#ECDFCC]">Premium Required</h1>
          <p className="text-[#C4B8A8]/80">This page requires a premium subscription.</p>
          <Button className="bg-[#697565] hover:bg-[#697565]/90">
            Upgrade to Premium
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1014] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg mb-4">
            <span className="text-2xl">⭐</span>
          </div>
          <h1 className="text-3xl font-bold text-[#ECDFCC] mb-2">Premium Features</h1>
          <p className="text-[#C4B8A8]/80">Welcome to your premium dashboard, {session?.user?.name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-[#1A1C20] border-[#1A1C20]/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="text-blue-400">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-[#ECDFCC]">Advanced Analytics</h3>
            </div>
            <p className="text-[#C4B8A8]/80 mb-4">
              Get detailed player performance analytics, trend analysis, and predictive insights.
            </p>
            <Button className="w-full">View Analytics</Button>
          </Card>

          <Card className="p-6 bg-[#1A1C20] border-[#1A1C20]/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <span className="text-green-400">🔄</span>
              </div>
              <h3 className="text-lg font-semibold text-[#ECDFCC]">Trade Analyzer</h3>
            </div>
            <p className="text-[#C4B8A8]/80 mb-4">
              Analyze trade proposals with AI-powered recommendations and fair value calculations.
            </p>
            <Button className="w-full">Analyze Trades</Button>
          </Card>

          <Card className="p-6 bg-[#1A1C20] border-[#1A1C20]/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <span className="text-purple-400">🏥</span>
              </div>
              <h3 className="text-lg font-semibold text-[#ECDFCC]">Injury Impact</h3>
            </div>
            <p className="text-[#C4B8A8]/80 mb-4">
              Get real-time injury updates and their impact on player values and lineup decisions.
            </p>
            <Button className="w-full">View Injury Reports</Button>
          </Card>

          <Card className="p-6 bg-[#1A1C20] border-[#1A1C20]/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <span className="text-orange-400">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-[#ECDFCC]">Matchup Optimizer</h3>
            </div>
            <p className="text-[#C4B8A8]/80 mb-4">
              Optimize your lineup based on opponent matchups and defensive rankings.
            </p>
            <Button className="w-full">Optimize Lineup</Button>
          </Card>
        </div>

        <Card className="mt-8 p-6 bg-gradient-to-r from-[#697565]/10 to-[#697565]/5 border-[#697565]/20">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-[#ECDFCC] mb-2">Premium Support</h3>
            <p className="text-[#C4B8A8]/80 mb-4">
              Need help? Premium users get priority support with faster response times.
            </p>
            <Button variant="outline" className="border-[#697565] text-[#697565] hover:bg-[#697565] hover:text-[#ECDFCC]">
              Contact Premium Support
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
