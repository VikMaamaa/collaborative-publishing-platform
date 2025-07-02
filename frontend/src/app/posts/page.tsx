import React from 'react';
import { postService } from '@/lib/services';
import PostList from '@/components/posts/PostList';

export const revalidate = 60;

export default async function PostsPage() {
  const postsResponse = await postService.getPosts({ status: 'published', limit: 100 });
  const posts = postsResponse.items || postsResponse;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Posts</h1>
      </div>
      <PostList posts={posts} />
    </div>
  );
} 