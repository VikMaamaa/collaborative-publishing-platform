import { useState, useEffect, useCallback } from 'react';
import { apiClient, loadingManager, ApiError } from './api';
import { User, Organization, OrganizationMember, Post, PaginatedResponse, Invitation, CreateInvitationData } from '@/types';

// Hook for managing API state
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

// Generic API hook
function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  autoFetch: boolean = true
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError('Unknown error', 0));
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}

// Auth hooks
export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.login({ email, password });
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Login failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, loading, error };
}

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const register = useCallback(async (userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.register(userData);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Registration failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { register, loading, error };
}

export function useLogout() {
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { logout, loading };
}

// User hooks
export function useCurrentUser(userId?: string) {
  return useApi(() => apiClient.getCurrentUser(userId), [userId], false);
}

export function useUpdateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.updateUser(userId, userData);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Update failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateUser, loading, error };
}

export function useChangePassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const changePassword = useCallback(async (
    userId: string,
    passwordData: { currentPassword: string; newPassword: string }
  ) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.changePassword(userId, passwordData);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Password change failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { changePassword, loading, error };
}

// Organization hooks
export function useOrganizations() {
  return useApi(() => apiClient.getOrganizations());
}

export function useOrganization(organizationId: string) {
  return useApi(
    () => apiClient.getOrganization(organizationId),
    [organizationId],
    !!organizationId
  );
}

export function useCreateOrganization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const createOrganization = useCallback(async (organizationData: {
    name: string;
    description?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.createOrganization(organizationData);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Creation failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createOrganization, loading, error };
}

export function useUpdateOrganization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updateOrganization = useCallback(async (
    organizationId: string,
    organizationData: Partial<Organization>
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.updateOrganization(organizationId, organizationData);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Update failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateOrganization, loading, error };
}

export function useDeleteOrganization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const deleteOrganization = useCallback(async (organizationId: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.deleteOrganization(organizationId);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Deletion failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteOrganization, loading, error };
}

// Organization member hooks
export function useOrganizationMembers(organizationId: string) {
  return useApi(
    () => apiClient.getOrganizationMembers(organizationId),
    [organizationId],
    !!organizationId
  );
}

export function useInviteMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const inviteMember = useCallback(async (
    organizationId: string,
    email: string,
    role: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.inviteMember(organizationId, email, role);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Invitation failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { inviteMember, loading, error };
}

export function useUpdateMemberRole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updateMemberRole = useCallback(async (
    organizationId: string,
    userId: string,
    role: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.updateMemberRole(organizationId, userId, role);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Role update failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateMemberRole, loading, error };
}

export function useRemoveMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const removeMember = useCallback(async (organizationId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.removeMember(organizationId, userId);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Member removal failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { removeMember, loading, error };
}

// Post hooks
export function usePosts(params?: {
  organizationId?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useApi(
    () => apiClient.getPosts(params),
    [params?.organizationId, params?.status, params?.page, params?.limit, params?.search]
  );
}

export function usePost(postId: string) {
  return useApi(
    () => apiClient.getPost(postId),
    [postId],
    !!postId
  );
}

export function useCreatePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const createPost = useCallback(async (postData: {
    title: string;
    content: string;
    organizationId: string;
    status?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.createPost(postData);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Post creation failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createPost, loading, error };
}

export function useUpdatePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updatePost = useCallback(async (postId: string, postData: Partial<Post>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.updatePost(postId, postData);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Post update failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updatePost, loading, error };
}

export function useDeletePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const deletePost = useCallback(async (postId: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.deletePost(postId);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Post deletion failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deletePost, loading, error };
}

// Loading state hook
export function useLoadingState(requestKey: string): boolean {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = loadingManager.subscribe((key, isLoading) => {
      if (key === requestKey) {
        setLoading(isLoading);
      }
    });

    // Set initial loading state
    setLoading(loadingManager.getLoading(requestKey));

    return () => {
      unsubscribe();
    };
  }, [requestKey]);

  return loading;
}

// Invitation hooks
export function useOrganizationInvitations(organizationId: string) {
  return useApi(
    () => apiClient.getOrganizationInvitations(organizationId),
    [organizationId],
    !!organizationId
  );
}

export function useCreateInvitation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const createInvitation = useCallback(async (
    organizationId: string,
    invitationData: CreateInvitationData
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.createInvitation(organizationId, invitationData);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Invitation creation failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createInvitation, loading, error };
}

export function useResendInvitation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const resendInvitation = useCallback(async (organizationId: string, invitationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.resendInvitation(organizationId, invitationId);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Failed to resend invitation', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { resendInvitation, loading, error };
}

export function useCancelInvitation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const cancelInvitation = useCallback(async (organizationId: string, invitationId: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.cancelInvitation(organizationId, invitationId);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Failed to cancel invitation', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { cancelInvitation, loading, error };
}

export function useUserInvitations() {
  return useApi(() => apiClient.getUserInvitations());
}

export function useAcceptInvitation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const acceptInvitation = useCallback(async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.acceptInvitation({ token });
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Failed to accept invitation', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { acceptInvitation, loading, error };
} 