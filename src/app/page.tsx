'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1014]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#697565] to-[#697565]/70 flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-2xl">🏈</span>
          </div>
          <p className="text-[#C4B8A8]/80">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to signin
  }

  return <ChatInterface />;
}
