'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Badge } from '@/components/ui';
import { apiClient } from '@/lib/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function PostDetailPage() {
  const params = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const postData = await apiClient.getPost(params.id as string);
        setPost(postData);
      } catch (err: any) {
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="max-w-2xl mx-auto py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !post) {
    return (
      <ProtectedRoute>
        <div className="max-w-2xl mx-auto py-8">
          <Card>
            <div className="p-6 text-center">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Post Not Found</h1>
              <p className="text-gray-600">The post you're looking for doesn't exist or you don't have permission to view it.</p>
            </div>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
            <div className="flex items-center gap-4 mb-2">
              <Badge variant="success">{post.status}</Badge>
              <span className="text-gray-500 text-sm">By {post.author?.username || post.author?.email || '-'}</span>
            </div>
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
} 