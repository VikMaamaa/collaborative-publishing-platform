import React from 'react';
import { postService } from '@/lib/services';
import { Card, Badge } from '@/components/ui';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  // Fetch all published posts for static generation
  const posts = await postService.getPosts({ status: 'published', limit: 100 });
  return (posts.items || posts).map((post: any) => ({ id: post.id }));
}

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  // Fetch the post (only published)
  let post;
  try {
    post = await postService.getPost(params.id);
  } catch {
    return notFound();
  }
  if (!post || post.status !== 'published') return notFound();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <div className="p-6 space-y-6">
          <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
          <div className="flex items-center gap-4 mb-2">
            <Badge variant="success">published</Badge>
            <span className="text-gray-500 text-sm">By {post.author?.username || post.author?.email || '-'}</span>
          </div>
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </Card>
    </div>
  );
} 