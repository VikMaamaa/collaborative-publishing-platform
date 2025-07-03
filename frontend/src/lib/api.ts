import { User, Organization, OrganizationMember, Post, AuthResponse, ApiResponse, PaginatedResponse, Invitation, CreateInvitationData, AcceptInvitationData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request/Response types
export interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  retry?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export interface ApiRequestConfig extends RequestConfig {
  params?: Record<string, string | number | boolean>;
}

// Loading state management
class LoadingManager {
  private loadingStates = new Map<string, boolean>();
  private listeners = new Set<(key: string, loading: boolean) => void>();

  setLoading(key: string, loading: boolean) {
    this.loadingStates.set(key, loading);
    this.listeners.forEach(listener => listener(key, loading));
  }

  getLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  subscribe(listener: (key: string, loading: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const loadingManager = new LoadingManager();

class ApiClient {
  private baseURL: string;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Request interceptor
  private async requestInterceptor(config: RequestConfig): Promise<RequestConfig> {
    // Add auth token if not skipped
    if (!config.skipAuth) {
      const token = this.getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    // Add default headers
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    return config;
  }

  // Response interceptor
  private async responseInterceptor<T>(response: Response, config: RequestConfig): Promise<T> {
    if (response.ok) {
      return response.json();
    }

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && !config.skipAuth && config.retry !== false) {
      try {
        const newToken = await this.refreshAuthToken();
        if (newToken) {
          // Retry the original request with new token
          const retryConfig = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            },
            retry: false, // Prevent infinite retry loop
          };
          
          const retryResponse = await fetch(response.url, retryConfig);
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and throw error
        this.clearAuth();
        throw new ApiError('Authentication failed', 401);
      }
    }

    // Handle other errors
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData.code,
      errorData.details
    );
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  public setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', token);
  }

  public clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    // Dispatch logout event for store
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  // Refresh token with deduplication
  private async refreshAuthToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshToken()
      .then(response => {
        this.setToken(response.access_token);
        return response.access_token;
      })
      .catch(error => {
        this.clearAuth();
        throw error;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  // Main request method with interceptors
  private async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, config.params);
    const requestKey = `${config.method || 'GET'}:${endpoint}`;
    
    console.log('Making request to:', url);
    console.log('Request config:', config);
    
    try {
      // Set loading state
      loadingManager.setLoading(requestKey, true);
      
      // Apply request interceptor
      const interceptedConfig = await this.requestInterceptor(config);
      console.log('Intercepted config:', interceptedConfig);
      
      // Make request
      const response = await fetch(url, interceptedConfig);
      console.log('Response status:', response.status);
      
      // Apply response interceptor
      const data = await this.responseInterceptor<T>(response, interceptedConfig);
      console.log('Response data:', data);
      
      return data;
    } catch (error) {
      console.error('Request error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        'NETWORK_ERROR'
      );
    } finally {
      // Clear loading state
      loadingManager.setLoading(requestKey, false);
    }
  }

  // Build URL with query parameters
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = `${this.baseURL}${endpoint}`;
    if (!params) return url;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
  }

  async register(userData: { 
    email: string; 
    username: string; 
    password: string; 
    firstName?: string; 
    lastName?: string 
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true,
    });
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.clearAuth();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    });
  }

  // User endpoints
  async getCurrentUser(userId?: string): Promise<User> {
    console.log('getCurrentUser called with userId:', userId);
    if (userId) {
      console.log('Calling /users/me/${userId}');
      return this.request<User>(`/users/me/${userId}`);
    }
    // Fallback to /me endpoint if no userId provided
    console.log('Calling /users/me');
    return this.request<User>('/users/me');
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(
    userId: string, 
    passwordData: { currentPassword: string; newPassword: string }
  ): Promise<void> {
    return this.request<void>(`/users/${userId}/password`, {
      method: 'PATCH',
      body: JSON.stringify(passwordData),
    });
  }

  async deleteAccount(userId: string): Promise<void> {
    return this.request<void>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Organization endpoints
  async getOrganizations(): Promise<Organization[]> {
    return this.request<Organization[]>('/organizations');
  }

  async getOrganization(organizationId: string): Promise<Organization> {
    return this.request<Organization>(`/organizations/${organizationId}`);
  }

  async createOrganization(organizationData: { 
    name: string; 
    description?: string 
  }): Promise<Organization> {
    return this.request<Organization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(organizationData),
    });
  }

  async updateOrganization(
    organizationId: string, 
    organizationData: Partial<Organization>
  ): Promise<Organization> {
    return this.request<Organization>(`/organizations/${organizationId}`, {
      method: 'PUT',
      body: JSON.stringify(organizationData),
    });
  }

  async deleteOrganization(organizationId: string): Promise<void> {
    return this.request<void>(`/organizations/${organizationId}`, {
      method: 'DELETE',
    });
  }

  // Organization member endpoints
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    return this.request<OrganizationMember[]>(`/organizations/${organizationId}/members`);
  }

  async inviteMember(
    organizationId: string, 
    email: string, 
    role: string
  ): Promise<OrganizationMember> {
    return this.request<OrganizationMember>(`/organizations/${organizationId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async updateMemberRole(
    organizationId: string, 
    userId: string, 
    role: string
  ): Promise<OrganizationMember> {
    return this.request<OrganizationMember>(`/organizations/${organizationId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
    return this.request<void>(`/organizations/${organizationId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Post endpoints
  async getPosts(params?: { 
    organizationId?: string; 
    status?: string; 
    page?: number; 
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Post>> {
    if (params?.organizationId) {
      // Use organization-specific endpoint
      const { organizationId, ...otherParams } = params;
      return this.request<PaginatedResponse<Post>>(`/organizations/${organizationId}/posts`, { params: otherParams });
    }
    // Use standalone endpoint for all posts
    return this.request<PaginatedResponse<Post>>('/posts', { params });
  }

  async getPost(postId: string): Promise<Post> {
    return this.request<Post>(`/posts/${postId}`);
  }

  async createPost(postData: { 
    title: string; 
    content: string; 
    organizationId: string; 
    excerpt?: string;
    isPublic?: boolean;
  }): Promise<Post> {
    // Only send allowed fields to the backend
    const { organizationId, ...allowedFields } = postData;
    return this.request<Post>(`/organizations/${organizationId}/posts`, {
      method: 'POST',
      body: JSON.stringify(allowedFields),
    });
  }

  async updatePost(postId: string, postData: Partial<Post>): Promise<Post> {
    // We need the organizationId to update a post
    // For now, we'll need to get it from the post data or pass it separately
    // This is a limitation of the current API design
    throw new Error('Post update requires organizationId. Please use the organization-specific endpoint.');
  }

  async updatePostInOrganization(organizationId: string, postId: string, postData: Partial<Post>): Promise<Post> {
    // Only send allowed fields to the backend
    const allowedFields: any = {};
    if (postData.title !== undefined) allowedFields.title = postData.title;
    if (postData.content !== undefined) allowedFields.content = postData.content;
    if (postData.excerpt !== undefined) allowedFields.excerpt = postData.excerpt;
    if ((postData as any).isPublic !== undefined) allowedFields.isPublic = (postData as any).isPublic;
    if ((postData as any).status !== undefined) allowedFields.status = (postData as any).status;
    if ((postData as any).rejectionReason !== undefined) allowedFields.rejectionReason = (postData as any).rejectionReason;
    
    console.log('API Client - Sending update data:', allowedFields);
    
    return this.request<Post>(`/organizations/${organizationId}/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(allowedFields),
    });
  }

  async deletePost(postId: string): Promise<void> {
    // We need the organizationId to delete a post
    // For now, we'll need to get it from the post data or pass it separately
    // This is a limitation of the current API design
    throw new Error('Post deletion requires organizationId. Please use the organization-specific endpoint.');
  }

  async deletePostInOrganization(organizationId: string, postId: string): Promise<void> {
    return this.request<void>(`/organizations/${organizationId}/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async getPostInOrganization(orgId: string, postId: string): Promise<Post> {
    return this.request<Post>(`/organizations/${orgId}/posts/${postId}`);
  }

  // Invitation endpoints
  async getOrganizationInvitations(organizationId: string): Promise<Invitation[]> {
    return this.request<Invitation[]>(`/organizations/${organizationId}/invitations`);
  }

  async createInvitation(
    organizationId: string, 
    invitationData: CreateInvitationData
  ): Promise<Invitation> {
    return this.request<Invitation>(`/organizations/${organizationId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(invitationData),
    });
  }

  async resendInvitation(organizationId: string, invitationId: string): Promise<Invitation> {
    return this.request<Invitation>(`/organizations/${organizationId}/invitations/${invitationId}/resend`, {
      method: 'POST',
    });
  }

  async cancelInvitation(organizationId: string, invitationId: string): Promise<void> {
    return this.request<void>(`/organizations/${organizationId}/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  }

  async acceptInvitation(invitationData: AcceptInvitationData): Promise<OrganizationMember> {
    return this.request<OrganizationMember>('/organizations/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(invitationData),
    });
  }

  async getUserInvitations(): Promise<Invitation[]> {
    return this.request<Invitation[]>('/organizations/invitations/my');
  }

  // Search methods
  async searchPosts(query: string, filters?: any): Promise<ApiResponse<Post[]>> {
    const params = { q: query, ...filters };
    return this.request<ApiResponse<Post[]>>('/search/posts', { params });
  }

  async searchUsers(query: string, filters?: any): Promise<ApiResponse<User[]>> {
    const params = { q: query, ...filters };
    return this.request<ApiResponse<User[]>>('/search/users', { params });
  }

  async searchOrganizations(query: string, filters?: any): Promise<ApiResponse<Organization[]>> {
    const params = { q: query, ...filters };
    return this.request<ApiResponse<Organization[]>>('/search/organizations', { params });
  }

  async searchAll(query: string, filters?: any): Promise<{
    posts: Post[];
    users: User[];
    organizations: Organization[];
  }> {
    const params = { q: query, ...filters };
    return this.request<{
      posts: Post[];
      users: User[];
      organizations: Organization[];
    }>('/search/all', { params });
  }

  // Utility methods
  clearToken(): void {
    this.clearAuth();
  }
}

export const apiClient = new ApiClient(API_BASE_URL); 