'use client';

import React from 'react';
import PostList from '@/components/posts/PostList';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function PostsPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Posts</h1>
        </div>
        <PostList />
      </div>
    </ProtectedRoute>
  );
} 