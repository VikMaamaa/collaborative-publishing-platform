"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, usePermissions, useUI } from "@/lib/hooks";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { createPost } from '@/store/postsSlice';
import PostEditor from "@/components/posts/PostEditor";
import { Button, Card, Input } from "@/components/ui";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const { addNotification } = useUI();
  const dispatch = useAppDispatch();
  const activeOrganization = useAppSelector(state => state.organizations.activeOrganization);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-center">Loading...</div>
      </ProtectedRoute>
    );
  }

  if (!activeOrganization) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-center">
          <p>No active organization selected. Please select an organization first.</p>
          <button 
            onClick={() => router.push('/organizations')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Organizations
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dispatch(createPost({
        title,
        content,
        organizationId: activeOrganization.id,
      }));
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Post created successfully!',
        duration: 3000,
      });
      router.push("/posts");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create post";
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <h1 className="text-2xl font-bold mb-2">Create New Post</h1>
            <div>
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter post title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <PostEditor value={content} onChange={setContent} placeholder="Write your post..." />
            </div>
            <div className="flex gap-4">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Save as Draft
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/posts")}>Cancel</Button>
            </div>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  );
} 