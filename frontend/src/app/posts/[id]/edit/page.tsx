"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth, usePermissions, useUI } from "@/lib/hooks";
import PostEditor from "@/components/posts/PostEditor";
import { Button, Card, Input, Badge } from "@/components/ui";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadPosts, updatePost, deletePost, setCurrentPost } from '@/store/postsSlice';
import { apiClient } from '@/lib/api';

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
  const { addNotification } = useUI();
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  // Function to load a specific post if not found in store
  const loadSpecificPost = async (orgId: string, postId: string) => {
    try {
      setIsLoadingPost(true);
      const fetchedPost = await apiClient.getPostInOrganization(orgId, postId);
      console.log('DEBUG: API response for post:', fetchedPost);
      setPost(fetchedPost);
      setTitle(fetchedPost.title);
      setContent(fetchedPost.content);
      setStatus(fetchedPost.status);
      setReview(fetchedPost.rejectionReason || "");
      console.log('Set review to:', fetchedPost.rejectionReason || "");
    } catch (error: any) {
      console.error('Error loading post:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error.message || 'Failed to load post',
        duration: 5000,
      });
    } finally {
      setIsLoadingPost(false);
    }
  };

  useEffect(() => {
    if (!posts.length) {
      dispatch(loadPosts());
    }
  }, [dispatch, posts.length]);

  useEffect(() => {
    const found = posts.find((p: any) => p.id === params.id);
    if (found) {
      console.log('Found post data:', found);
      setPost(found);
      setTitle(found.title);
      setContent(found.content);
      setStatus(found.status);
      setReview(found.rejectionReason || "");
      console.log('Set review to:', found.rejectionReason || "");
    } else if (posts.length > 0 && !isLoadingPost && activeOrganization) {
      // Post not found in store, but posts are loaded - try to load it directly
      console.log('Post not found in store, trying to load directly');
      loadSpecificPost(activeOrganization.id, params.id as string);
    }
  }, [posts, params.id, isLoadingPost, activeOrganization]);

  // Load specific post if no posts are loaded yet (direct navigation)
  useEffect(() => {
    if (!posts.length && !isLoading && !isLoadingPost && params.id && activeOrganization) {
      console.log('No posts loaded, loading specific post directly');
      loadSpecificPost(activeOrganization.id, params.id as string);
    }
  }, [posts.length, isLoading, isLoadingPost, params.id, activeOrganization]);

  if (isLoading || isLoadingPost || !post) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center">
          {isLoading || isLoadingPost ? (
            <div>
              <p className="text-lg mb-4">Loading post...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div>
              <p className="text-lg mb-4">Post not found</p>
              <button 
                onClick={() => router.push('/posts')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Back to Posts
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const canEdit =
    hasRole("owner") ||
    hasRole("editor") ||
    (hasRole("writer") && post.status !== "published" && post.authorId === user?.id);

  const canEditPublished = (hasRole("editor") || hasRole("owner")) && post.status === "published";
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
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'No active organization selected. Please select an organization first.',
        duration: 5000,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      let updateData: any = {};
      
      // For published posts, only allow specific updates for editors and owners
      if (post.status === "published") {
        const isEditorOrOwner = hasRole("editor") || hasRole("owner");
        if (isEditorOrOwner) {
          // Only allow rejectionReason and status updates on published posts
          if (canEditReview && review !== undefined) {
            updateData.rejectionReason = review;
          }
          if (status !== post.status) {
            updateData.status = status;
          }
        } else {
          addNotification({
            id: Date.now().toString(),
            type: 'error',
            message: 'Published posts cannot be edited except by editors and owners',
            duration: 5000,
          });
          return;
        }
      } else {
        // For non-published posts, allow all fields
        updateData = { title, content, status };
        if (canEditReview && review) {
          updateData.rejectionReason = review;
        }
      }
      
      console.log('Sending update data:', updateData);
      await dispatch(updatePost({ 
        id: post.id, 
        organizationId: activeOrganization.id,
        data: updateData
      }));
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Post updated successfully!',
        duration: 3000,
      });
      router.push("/posts");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update post";
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

  const handleStatusChange = async (newStatus: string) => {
    if (!activeOrganization) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'No active organization selected. Please select an organization first.',
        duration: 5000,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(updatePost({ 
        id: post.id, 
        organizationId: activeOrganization.id,
        data: { status: newStatus } 
      }));
      setStatus(newStatus);
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: `Post status updated to ${newStatus.replace('_', ' ')}`,
        duration: 3000,
      });
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update status";
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

  const handleDelete = async () => {
    if (!activeOrganization) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'No active organization selected. Please select an organization first.',
        duration: 5000,
      });
      return;
    }
    setIsSubmitting(true);
    setShowDeleteConfirm(false);
    try {
      await dispatch(deletePost({ id: post.id, organizationId: activeOrganization.id }));
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Post deleted successfully!',
        duration: 3000,
      });
      router.push("/posts");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to delete post";
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
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-6 p-6">
          <h1 className="text-2xl font-bold mb-2">Edit Post</h1>
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
              {post.status === "published" && !canEditPublished && (
                <div>• Published posts can only be edited by editors and owners (for review feedback and status changes)</div>
              )}
            </div>
          )}
          {!canEditReview && (
            <div className="bg-yellow-100 text-yellow-700 p-2 rounded">
              <strong>Review Field:</strong> Only Editors and Owners can edit the review/feedback field.
            </div>
          )}
          {post.status === "published" && canEditPublished && (
            <div className="bg-green-100 text-green-700 p-2 rounded">
              <strong>Published Post:</strong> As an editor/owner, you can update the review feedback and change the status of this published post.
            </div>
          )}
          <div>
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter post title"
              disabled={!canEdit || canEditPublished}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <PostEditor 
              value={content} 
              onChange={setContent} 
              editable={canEdit && !canEditPublished} 
              placeholder="Write your post..." 
            />
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