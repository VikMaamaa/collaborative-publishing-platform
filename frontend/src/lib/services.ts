import { apiClient, ApiError } from './api';
import { 
  User, 
  Organization, 
  OrganizationMember, 
  Post, 
  AuthResponse, 
  PaginatedResponse,
  LoginCredentials,
  RegisterData
} from '@/types';

// Base service class with common error handling
abstract class BaseService {
  protected handleError(error: unknown, defaultMessage: string): never {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : defaultMessage,
      0,
      'SERVICE_ERROR'
    );
  }
}

// Auth Service
export class AuthService extends BaseService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      return await apiClient.login(credentials);
    } catch (error) {
      this.handleError(error, 'Login failed');
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      return await apiClient.register(userData);
    } catch (error) {
      this.handleError(error, 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      this.handleError(error, 'Logout failed');
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      return await apiClient.refreshToken();
    } catch (error) {
      this.handleError(error, 'Token refresh failed');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      return await apiClient.getCurrentUser();
    } catch (error) {
      this.handleError(error, 'Failed to get current user');
    }
  }
}

// User Service
export class UserService extends BaseService {
  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    try {
      return await apiClient.updateUser(userId, userData);
    } catch (error) {
      this.handleError(error, 'Failed to update user');
    }
  }

  async changePassword(
    userId: string, 
    passwordData: { currentPassword: string; newPassword: string }
  ): Promise<void> {
    try {
      await apiClient.changePassword(userId, passwordData);
    } catch (error) {
      this.handleError(error, 'Failed to change password');
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    try {
      await apiClient.deleteAccount(userId);
    } catch (error) {
      this.handleError(error, 'Failed to delete account');
    }
  }
}

// Organization Service
export class OrganizationService extends BaseService {
  async getOrganizations(): Promise<Organization[]> {
    try {
      return await apiClient.getOrganizations();
    } catch (error) {
      this.handleError(error, 'Failed to fetch organizations');
    }
  }

  async getOrganization(organizationId: string): Promise<Organization> {
    try {
      return await apiClient.getOrganization(organizationId);
    } catch (error) {
      this.handleError(error, 'Failed to fetch organization');
    }
  }

  async createOrganization(organizationData: { 
    name: string; 
    description?: string 
  }): Promise<Organization> {
    try {
      return await apiClient.createOrganization(organizationData);
    } catch (error) {
      this.handleError(error, 'Failed to create organization');
    }
  }

  async updateOrganization(
    organizationId: string, 
    organizationData: Partial<Organization>
  ): Promise<Organization> {
    try {
      return await apiClient.updateOrganization(organizationId, organizationData);
    } catch (error) {
      this.handleError(error, 'Failed to update organization');
    }
  }

  async deleteOrganization(organizationId: string): Promise<void> {
    try {
      await apiClient.deleteOrganization(organizationId);
    } catch (error) {
      this.handleError(error, 'Failed to delete organization');
    }
  }
}

// Organization Member Service
export class OrganizationMemberService extends BaseService {
  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      return await apiClient.getOrganizationMembers(organizationId);
    } catch (error) {
      this.handleError(error, 'Failed to fetch organization members');
    }
  }

  async inviteMember(
    organizationId: string, 
    email: string, 
    role: string
  ): Promise<OrganizationMember> {
    try {
      return await apiClient.inviteMember(organizationId, email, role);
    } catch (error) {
      this.handleError(error, 'Failed to invite member');
    }
  }

  async updateMemberRole(
    organizationId: string, 
    userId: string, 
    role: string
  ): Promise<OrganizationMember> {
    try {
      return await apiClient.updateMemberRole(organizationId, userId, role);
    } catch (error) {
      this.handleError(error, 'Failed to update member role');
    }
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
    try {
      await apiClient.removeMember(organizationId, userId);
    } catch (error) {
      this.handleError(error, 'Failed to remove member');
    }
  }
}

// Post Service
export class PostService extends BaseService {
  async getPosts(params?: { 
    organizationId?: string; 
    status?: string; 
    page?: number; 
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Post>> {
    try {
      return await apiClient.getPosts(params);
    } catch (error) {
      this.handleError(error, 'Failed to fetch posts');
    }
  }

  async getPost(postId: string): Promise<Post> {
    try {
      return await apiClient.getPost(postId);
    } catch (error) {
      this.handleError(error, 'Failed to fetch post');
    }
  }

  async createPost(postData: { 
    title: string; 
    content: string; 
    organizationId: string; 
    status?: string 
  }): Promise<Post> {
    try {
      return await apiClient.createPost(postData);
    } catch (error) {
      this.handleError(error, 'Failed to create post');
    }
  }

  async updatePost(postId: string, postData: Partial<Post>): Promise<Post> {
    try {
      return await apiClient.updatePost(postId, postData);
    } catch (error) {
      this.handleError(error, 'Failed to update post');
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      await apiClient.deletePost(postId);
    } catch (error) {
      this.handleError(error, 'Failed to delete post');
    }
  }

  // Post-specific business logic methods
  async publishPost(postId: string): Promise<Post> {
    try {
      return await apiClient.updatePost(postId, { status: 'published' });
    } catch (error) {
      this.handleError(error, 'Failed to publish post');
    }
  }

  async archivePost(postId: string): Promise<Post> {
    try {
      return await apiClient.updatePost(postId, { status: 'archived' });
    } catch (error) {
      this.handleError(error, 'Failed to archive post');
    }
  }

  async getDraftPosts(organizationId: string): Promise<PaginatedResponse<Post>> {
    try {
      return await apiClient.getPosts({ 
        organizationId, 
        status: 'draft' 
      });
    } catch (error) {
      this.handleError(error, 'Failed to fetch draft posts');
    }
  }

  async getPublishedPosts(organizationId: string): Promise<PaginatedResponse<Post>> {
    try {
      return await apiClient.getPosts({ 
        organizationId, 
        status: 'published' 
      });
    } catch (error) {
      this.handleError(error, 'Failed to fetch published posts');
    }
  }
}

// Service instances
export const authService = new AuthService();
export const userService = new UserService();
export const organizationService = new OrganizationService();
export const organizationMemberService = new OrganizationMemberService();
export const postService = new PostService();

// Service factory for dependency injection
export class ServiceFactory {
  private static instance: ServiceFactory;
  
  private constructor() {}
  
  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  getAuthService(): AuthService {
    return authService;
  }

  getUserService(): UserService {
    return userService;
  }

  getOrganizationService(): OrganizationService {
    return organizationService;
  }

  getOrganizationMemberService(): OrganizationMemberService {
    return organizationMemberService;
  }

  getPostService(): PostService {
    return postService;
  }
}

// Export the factory instance
export const serviceFactory = ServiceFactory.getInstance(); 