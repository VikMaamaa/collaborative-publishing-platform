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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Collaborative Publishing Platform</h1>
      <p className="text-lg text-gray-600">Please log in to access your dashboard.</p>
    </div>
  );
}
