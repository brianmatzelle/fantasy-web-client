'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';

export default function Upgrade() {
  return (
    <AuthLayout 
      title="Premium Required" 
      subtitle="Upgrade to access premium features"
    >
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center">
          <span className="text-2xl">⭐</span>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[#ECDFCC]">
            Premium Feature
          </h3>
          <p className="text-sm text-[#C4B8A8]/80">
            This feature is available to premium subscribers only. Upgrade your account to unlock advanced analytics and insights.
          </p>
        </div>

        <div className="bg-[#697565]/10 rounded-lg p-4">
          <h4 className="font-medium text-[#ECDFCC] mb-2">Premium Features Include:</h4>
          <ul className="text-sm text-[#C4B8A8]/80 space-y-1 text-left">
            <li>• Advanced player analytics</li>
            <li>• Trade recommendations</li>
            <li>• Injury impact analysis</li>
            <li>• Priority support</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1 bg-[#697565] hover:bg-[#697565]/90">
            Upgrade to Premium
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/">
              Continue with Free
            </Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}

