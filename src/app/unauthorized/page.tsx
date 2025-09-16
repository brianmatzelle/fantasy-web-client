'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';

export default function Unauthorized() {
  return (
    <AuthLayout 
      title="Access Denied" 
      subtitle="You don't have permission to access this page"
    >
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <span className="text-2xl">🚫</span>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[#ECDFCC]">
            Insufficient Permissions
          </h3>
          <p className="text-sm text-[#C4B8A8]/80">
            The page you're trying to access requires higher privileges. Please contact an administrator if you believe this is an error.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href="/">
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/auth/signin">
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}

