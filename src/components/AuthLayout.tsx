'use client';

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0F1014] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#697565] to-[#697565]/70 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🏈</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-[#ECDFCC] tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm text-[#C4B8A8]/80">
              {subtitle}
            </p>
          )}
        </div>
        <div className="bg-[#1A1C20] rounded-2xl shadow-xl p-8 border border-[#1A1C20]/50">
          {children}
        </div>
      </div>
    </div>
  );
}
