'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#1A1C20] animate-pulse"></div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#697565] to-[#697565]/70 flex items-center justify-center hover:from-[#697565]/90 hover:to-[#697565]/60 transition-all duration-200"
      >
        <span className="text-[#ECDFCC] text-sm font-medium">
          {session.user.name?.[0]?.toUpperCase() || '👤'}
        </span>
      </button>

      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-10 z-20 w-64 bg-[#1A1C20] border border-[#1A1C20]/50 rounded-xl shadow-lg p-4">
            <div className="space-y-3">
              {/* User Info */}
              <div className="pb-3 border-b border-[#1A1C20]/50">
                <p className="font-medium text-[#ECDFCC]">{session.user.name}</p>
                <p className="text-sm text-[#C4B8A8]/80">{session.user.email}</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    session.user.role === 'admin' 
                      ? 'bg-red-500/10 text-red-400' 
                      : session.user.role === 'premium'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {session.user.role}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2 text-sm text-[#ECDFCC] hover:bg-[#0F1014] rounded-lg transition-colors">
                  Profile Settings
                </button>
                {session.user.role === 'admin' && (
                  <button className="w-full text-left px-3 py-2 text-sm text-[#ECDFCC] hover:bg-[#0F1014] rounded-lg transition-colors">
                    Admin Panel
                  </button>
                )}
                {session.user.role === 'user' && (
                  <button className="w-full text-left px-3 py-2 text-sm text-yellow-400 hover:bg-[#0F1014] rounded-lg transition-colors">
                    Upgrade to Premium
                  </button>
                )}
              </div>

              {/* Sign Out */}
              <div className="pt-3 border-t border-[#1A1C20]/50">
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full text-sm"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

