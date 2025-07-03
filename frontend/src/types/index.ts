// User types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: 'owner' | 'editor' | 'writer' | 'viewer';
  createdAt: string;
  updatedAt: string;
  user?: User;
  organization?: Organization;
}

// Invitation types
export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: 'owner' | 'editor' | 'writer' | 'viewer';
  status: 'pending' | 'accepted' | 'canceled' | 'expired';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  invitedBy?: string;
}

export interface CreateInvitationData {
  email: string;
  role: 'owner' | 'editor' | 'writer' | 'viewer';
}

export interface AcceptInvitationData {
  token: string;
}

// Post types
export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'in_review' | 'published' | 'rejected';
  rejectionReason?: string;
  publishedAt?: string;
  isPublic: boolean;
  authorId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
  organization?: Organization;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 