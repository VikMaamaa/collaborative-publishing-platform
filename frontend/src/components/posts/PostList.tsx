'use client';

import React from 'react';
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadPosts, createPost, updatePost, deletePost, setCurrentPost } from '@/store/postsSlice';
import { usePermissions, usePosts, useUI, useAuth } from "@/lib/hooks";
import { Card, Badge, Button } from "@/components/ui";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "published", label: "Published" },
];

export default function PostList({ posts: propPosts }: { posts?: any[] }) {
  const router = useRouter();
  const { hasRole, userRole } = usePermissions();
  const storePosts = useAppSelector((state) => state.posts.posts);
  const activeOrganization = useAppSelector((state) => state.organizations.activeOrganization);
  const dispatch = useAppDispatch();
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const { deletePost: postsDeletePost } = usePosts();
  const { addNotification } = useUI();
  const { user } = useAuth();

  // Use propPosts if provided, otherwise use storePosts, ensure it's always an array
  const posts = (propPosts || storePosts || []);

  useEffect(() => {
    if (!propPosts && activeOrganization) {
      setLoading(true);
      dispatch(loadPosts(activeOrganization.id))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [dispatch, propPosts, activeOrganization]);

  const filteredPosts = posts.filter((post) =>
    statusFilter === "all" ? true : post.status === statusFilter
  );

  const handleEdit = (id: string) => {
    router.push(`/posts/${id}/edit`);
  };

  const handleView = (id: string) => {
    router.push(`/posts/${id}`);
  };

  const handleDelete = (post: any) => {
    if (window.confirm(`Are you sure you want to delete "${post.title}"? This action cannot be undone.`)) {
      postsDeletePost(post.id)
        .then(() => {
          addNotification({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            type: 'success',
            message: `Post "${post.title}" deleted successfully`,
            duration: 4000,
          });
        })
        .catch((error: any) => {
          addNotification({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            type: 'error',
            message: error.message || 'Failed to delete post',
            duration: 4000,
          });
        });
    }
  };

  if (!activeOrganization) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No active organization selected.</p>
        <button 
          onClick={() => router.push('/organizations')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Select Organization
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded p-2"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <Card>
        <div className="p-4">
          {loading ? (
            <div>Loading posts...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-gray-500">No posts found.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2">Title</th>
                  <th className="py-2">Author</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="border-t">
                    <td className="py-2 font-medium cursor-pointer" onClick={() => handleView(post.id)}>{post.title}</td>
                    <td className="py-2">{post.author?.username || post.author?.email || "-"}</td>
                    <td className="py-2">
                      <Badge variant={
                        post.status === "published"
                          ? "success"
                          : post.status === "in_review"
                          ? "primary"
                          : "secondary"
                      }>
                        {post.status}
                      </Badge>
                    </td>
                    <td className="py-2 flex gap-2">
                      {/* Edit: Editors/Owners can edit any post, Writers can edit their own (not published) */}
                      {(
                        hasRole("owner") ||
                        hasRole("editor") ||
                        (hasRole("writer") && post.authorId === user?.id && post.status !== "published")
                      ) && (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(post.id)}>
                          Edit
                        </Button>
                      )}
                      {/* Submit for Review: Writers only, draft status, own posts */}
                      {hasRole("writer") && post.status === "draft" && post.authorId === user?.id && (
                        <Button size="sm" variant="primary">
                          Submit for Review
                        </Button>
                      )}
                      {/* Approve/Publish: Editors/Owners only, in_review status */}
                      {(hasRole("editor") || hasRole("owner")) && post.status === "in_review" && (
                        <Button size="sm" variant="primary">
                          Approve
                        </Button>
                      )}
                      {/* Delete: Authors can delete their own unpublished posts, Editors/Owners can delete any */}
                      {(hasRole("owner") || hasRole("editor") || (hasRole("writer") && post.status !== "published" && post.authorId === user?.id)) && (
                        <Button size="sm" variant="danger" onClick={() => handleDelete(post)}>
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
} 