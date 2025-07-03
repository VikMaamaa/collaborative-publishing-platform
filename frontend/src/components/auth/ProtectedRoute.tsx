'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after hydration is complete and we're not loading
    if (hasHydrated && !isLoading && (!isAuthenticated || !user)) {
      router.replace(redirectTo);
    }
  }, [hasHydrated, isLoading, isAuthenticated, user, router, redirectTo]);
  
  // Show loading while hydrating or loading
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }
  
  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return <>{children}</>;
} 