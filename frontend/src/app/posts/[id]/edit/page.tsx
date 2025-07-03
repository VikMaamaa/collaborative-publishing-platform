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
  const { hasRole, userRole } = usePermissions();
  const dispatch = useAppDispatch();
  const posts = useAppSelector((state) => state.posts.posts);
  const isLoading = useAppSelector((state) => state.posts.isLoading);
  const activeOrganization = useAppSelector((state) => state.organizations.activeOrganization);
  const [post, setPost] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [review, setReview] = useState("");
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
      setReview((found as any).rejectionReason || "");
    }
  }, [posts, params.id]);

  if (isLoading || !post) {
    return <div>Loading...</div>;
  }

  const canEdit =
    hasRole("owner") ||
    hasRole("editor") ||
    (hasRole("writer") && post.status !== "published" && post.authorId === user?.id);

  const canEditReview = hasRole("owner") || hasRole("editor");
  const canSubmit = hasRole("writer") && status === "draft";
  const canApprove = hasRole("editor") && status === "in_review";
  const canPublish = hasRole("editor") && status === "in_review";

  // Status options based on role
  const getStatusOptions = () => {
    if (hasRole("owner") || hasRole("editor")) {
      return [
        { value: "draft", label: "Draft" },
        { value: "in_review", label: "In Review" },
        { value: "published", label: "Published" },
        { value: "rejected", label: "Rejected" },
      ];
    } else if (hasRole("writer")) {
      return [
        { value: "draft", label: "Draft" },
        { value: "in_review", label: "In Review" },
      ];
    } else {
      return [
        { value: "draft", label: "Draft" },
        { value: "in_review", label: "In Review" },
        { value: "published", label: "Published" },
        { value: "rejected", label: "Rejected" },
      ];
    }
  };

  // Debug information
  console.log('Debug info:', {
    userRole,
    postAuthorId: post.authorId,
    currentUserId: user?.id,
    isAuthor: post.authorId === user?.id,
    postStatus: post.status,
    canEdit,
    hasWriterRole: hasRole("writer"),
    hasEditorRole: hasRole("editor"),
    hasOwnerRole: hasRole("owner")
  });

  const handleUpdate = async () => {
    if (!activeOrganization) {
      setError("No active organization selected");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const updateData: any = { title, content, status };
      if (canEditReview && review) {
        updateData.rejectionReason = review;
      }
      console.log('Sending update data:', updateData);
      await dispatch(updatePost({ 
        id: post.id, 
        organizationId: activeOrganization.id,
        data: updateData
      }));
      router.push("/posts");
    } catch (err: any) {
      setError(err.message || "Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activeOrganization) {
      setError("No active organization selected");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await dispatch(updatePost({ 
        id: post.id, 
        organizationId: activeOrganization.id,
        data: { status: newStatus } 
      }));
      setStatus(newStatus);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activeOrganization) {
      setError("No active organization selected");
      return;
    }
    setIsSubmitting(true);
    setShowDeleteConfirm(false);
    try {
      await dispatch(deletePost({ id: post.id, organizationId: activeOrganization.id }));
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
          <div className="bg-blue-100 text-blue-700 p-2 rounded">
            <strong>Current User Info:</strong>
            <br />
            Role: {userRole} (Need WRITER+ role to edit posts)
            <br />
            Organization: {activeOrganization?.name}
            <br />
            User ID: {user?.id}
            <br />
            Post Author ID: {post.authorId}
            <br />
            Is Author: {post.authorId === user?.id ? 'Yes' : 'No'}
            <br />
            Post Status: {post.status}
            <br />
            Can Edit: {canEdit ? 'Yes' : 'No'}
            <br />
            Can Edit Review: {canEditReview ? 'Yes' : 'No'}
          </div>
          {!canEdit && (
            <div className="bg-red-100 text-red-700 p-2 rounded">
              <strong>Access Denied:</strong> You cannot edit this post because:
              {!hasRole("writer") && !hasRole("editor") && !hasRole("owner") && (
                <div>• You need at least WRITER role (current: {userRole})</div>
              )}
              {hasRole("writer") && post.authorId !== user?.id && (
                <div>• As a WRITER, you can only edit your own posts</div>
              )}
              {post.status === "published" && (
                <div>• Published posts cannot be edited</div>
              )}
            </div>
          )}
          {!canEditReview && (
            <div className="bg-yellow-100 text-yellow-700 p-2 rounded">
              <strong>Review Field:</strong> Only Editors and Owners can edit the review/feedback field.
            </div>
          )}
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
                {getStatusOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="mt-2">
                <Badge variant={status === "published" ? "success" : status === "in_review" ? "primary" : "secondary"}>{status}</Badge>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review/Feedback {!canEditReview && "(Read-only)"}
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full border rounded p-2 min-h-[100px]"
                placeholder={canEditReview ? "Enter review feedback..." : "No review feedback available"}
                disabled={!canEditReview}
                readOnly={!canEditReview}
              />
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
              <Button type="button" variant="danger" disabled={isSubmitting} onClick={() => setShowDeleteConfirm(true)}>
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
                <Button variant="danger" onClick={handleDelete} disabled={isSubmitting}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 