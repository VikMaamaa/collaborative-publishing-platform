'use client';

import React from 'react';
import PostList from '@/components/posts/PostList';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { usePermissions } from '@/lib/hooks';
import { useRouter } from 'next/navigation';

export default function PostsPage() {
  const { hasRole } = usePermissions();
  const router = useRouter();
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Posts</h1>
            {(hasRole('owner') || hasRole('editor') || hasRole('writer')) && (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                onClick={() => router.push('/posts/create')}
              >
                Create Post
              </button>
            )}
          </div>
          <PostList />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 