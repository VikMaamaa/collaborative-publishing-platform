"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, usePermissions } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import PostEditor from "@/components/posts/PostEditor";
import { Button, Card, Input, Badge } from "@/components/ui";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "Submit for Review" },
];

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const createPost = useAppStore((s) => s.createPost);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createPost({
        title,
        content,
        status,
        organizationId: user.organizationMembers?.[0]?.organizationId, // or select active org
      });
      router.push("/posts");
    } catch (err: any) {
      setError(err.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <h1 className="text-2xl font-bold mb-2">Create New Post</h1>
          {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded p-2"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="mt-2">
              <Badge variant={status === "draft" ? "secondary" : "primary"}>{status}</Badge>
            </div>
          </div>
          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {status === "draft" ? "Save as Draft" : "Submit for Review"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/posts")}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 