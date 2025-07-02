'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { Button, SkeletonCard } from '@/components/ui';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <SkeletonCard title={true} subtitle={true} content={true} />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">CP</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Collaborative Publishing Platform
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create, collaborate, and publish content together
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => router.push('/register')}
            >
              Create Account
            </Button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Features
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Multi-tenant Organizations</h3>
                <p className="text-sm text-gray-500">Manage multiple organizations with role-based access</p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Collaborative Publishing</h3>
                <p className="text-sm text-gray-500">Create and edit content together with your team</p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Real-time Collaboration</h3>
                <p className="text-sm text-gray-500">Work together in real-time with notifications</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
