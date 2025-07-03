'use client';

import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { Button, SkeletonCard } from '@/components/ui';

export default function HomePage() {
  const { isAuthenticated, isLoading, hasHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after hydration is complete and we're not loading
    if (hasHydrated && !isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [hasHydrated, isAuthenticated, isLoading, router]);

  // Show loading while hydrating or loading
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <SkeletonCard title={true} subtitle={true} content={true} />
        </div>
      </div>
    );
  }

  // Don't render anything if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-2xl">CP</span>
          </div>
          <span className="text-2xl font-extrabold text-gray-900">Collaborative Publishing</span>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-center">Welcome to the Collaborative Publishing Platform</h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          Create, manage, and publish content collaboratively with your team. Join organizations, write posts, and streamline your publishing workflow.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => router.push('/login')}
          >
            Log In
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => router.push('/register')}
          >
            Sign Up
          </Button>
        </div>
      </div>
      <footer className="mt-10 text-gray-400 text-sm text-center">
        &copy; {new Date().getFullYear()} Collaborative Publishing Platform
      </footer>
    </div>
  );
}
