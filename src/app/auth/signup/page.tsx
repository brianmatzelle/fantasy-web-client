'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/components/AuthLayout';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        name,
        email,
        password,
        action: 'register',
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create your account" 
      subtitle="Join Fantasy Football AI and start dominating your league"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#ECDFCC] mb-2">
            Full name
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
            className="w-full bg-[#0F1014] border-[#1A1C20]/50 text-[#ECDFCC] placeholder-[#C4B8A8]/50 focus:border-[#697565]/50"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#ECDFCC] mb-2">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="w-full bg-[#0F1014] border-[#1A1C20]/50 text-[#ECDFCC] placeholder-[#C4B8A8]/50 focus:border-[#697565]/50"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#ECDFCC] mb-2">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="w-full bg-[#0F1014] border-[#1A1C20]/50 text-[#ECDFCC] placeholder-[#C4B8A8]/50 focus:border-[#697565]/50"
            placeholder="Create a password (min 8 characters)"
            minLength={8}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#ECDFCC] mb-2">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className="w-full bg-[#0F1014] border-[#1A1C20]/50 text-[#ECDFCC] placeholder-[#C4B8A8]/50 focus:border-[#697565]/50"
            placeholder="Confirm your password"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#697565] hover:bg-[#697565]/90 text-[#ECDFCC] h-12 rounded-xl font-medium"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#ECDFCC] border-t-transparent rounded-full animate-spin"></div>
              Creating account...
            </div>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[#C4B8A8]/80">
          Already have an account?{' '}
          <Link 
            href="/auth/signin" 
            className="font-medium text-[#697565] hover:text-[#697565]/80 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
