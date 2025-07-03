"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth, usePermissions } from "@/lib/hooks";
import PostEditor from "@/components/posts/PostEditor";
import { Button, Card, Input, Badge } from "@/components/ui";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadPosts, updatePost, deletePost, setCurrentPost } from '@/store/postsSlice';

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const dispatch = useAppDispatch();
  const posts = useAppSelector((state) => state.posts.posts);
  const isLoading = useAppSelector((state) => state.posts.isLoading);
  const [post, setPost] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!posts.length) {
      dispatch(loadPosts());
    }
  }, [dispatch, posts.length]);

  useEffect(() => {
    const found = posts.find((p: any) => p.id === params.id);
    if (found) {
      setPost(found);
      setTitle(found.title);
      setContent(found.content);
      setStatus(found.status);
    }
  }, [posts, params.id]);

  if (isLoading || !post) {
    return <div>Loading...</div>;
  }

  const canEdit =
    hasRole("owner") ||
    hasRole("editor") ||
    (hasRole("writer") && post.status !== "published" && post.authorId === user.id);

  const canSubmit = hasRole("writer") && status === "draft";
  const canApprove = hasRole("editor") && status === "in_review";
  const canPublish = hasRole("editor") && status === "in_review";

  const handleUpdate = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await dispatch(updatePost({ id: post.id, data: { title, content, status } }));
      router.push("/posts");
    } catch (err: any) {
      setError(err.message || "Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await dispatch(updatePost({ id: post.id, data: { status: newStatus } }));
      setStatus(newStatus);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setShowDeleteConfirm(false);
    try {
      await dispatch(deletePost(post.id));
      router.push("/posts");
    } catch (err: any) {
      setError(err.message || "Failed to delete post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-6 p-6">
          <h1 className="text-2xl font-bold mb-2">Edit Post</h1>
          {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
          <div>
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter post title"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <PostEditor value={content} onChange={setContent} editable={canEdit} placeholder="Write your post..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded p-2"
              disabled={!canEdit}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="mt-2">
              <Badge variant={status === "published" ? "success" : status === "in_review" ? "primary" : "secondary"}>{status}</Badge>
            </div>
          </div>
          <div className="flex gap-4 flex-wrap">
            {canEdit && (
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Save Changes
              </Button>
            )}
            {canSubmit && (
              <Button type="button" variant="primary" disabled={isSubmitting} onClick={() => handleStatusChange("in_review")}>Submit for Review</Button>
            )}
            {canApprove && (
              <Button type="button" variant="primary" disabled={isSubmitting} onClick={() => handleStatusChange("published")}>Approve & Publish</Button>
            )}
            <Button type="button" variant="outline" onClick={() => router.push("/posts")}>Cancel</Button>
            {canEdit && (
              <Button type="button" variant="error" disabled={isSubmitting} onClick={() => setShowDeleteConfirm(true)}>
                Delete Post
              </Button>
            )}
          </div>
        </form>
        {/* Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-bold mb-4">Delete Post?</h2>
              <p className="mb-4">Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="error" onClick={handleDelete} disabled={isSubmitting}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 