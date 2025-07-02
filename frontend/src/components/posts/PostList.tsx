import React from 'react';
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
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
  const { hasPermission, hasRole, userRole } = usePermissions();
  const storePosts = useAppStore((s) => s.posts);
  const loadPosts = useAppStore((s) => s.loadPosts);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const { deletePost } = usePosts();
  const { addNotification, openConfirmModal } = useUI();
  const { user } = useAuth();

  // Use propPosts if provided, otherwise use storePosts
  const posts = propPosts || storePosts;

  useEffect(() => {
    if (!propPosts) {
      setLoading(true);
      loadPosts()
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [loadPosts, propPosts]);

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
    openConfirmModal({
      title: 'Delete Post',
      message: `Are you sure you want to delete "${post.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        try {
          await deletePost(post.id);
          addNotification({
            type: 'success',
            message: `Post "${post.title}" deleted successfully`,
            duration: 4000,
          });
        } catch (error: any) {
          addNotification({
            type: 'error',
            message: error.message || 'Failed to delete post',
            duration: 4000,
          });
        }
      },
    });
  };

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
                      {/* Edit: Writers can edit their own drafts/in_review, Editors can edit any */}
                      {(hasRole("owner") || hasRole("editor") || (hasRole("writer") && post.status !== "published")) && (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(post.id)}>
                          Edit
                        </Button>
                      )}
                      {/* Approve/Publish: Editors only, in_review status */}
                      {hasRole("editor") && post.status === "in_review" && (
                        <Button size="sm" variant="primary">
                          Approve
                        </Button>
                      )}
                      {/* Submit: Writers only, draft status */}
                      {hasRole("writer") && post.status === "draft" && (
                        <Button size="sm" variant="primary">
                          Submit
                        </Button>
                      )}
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