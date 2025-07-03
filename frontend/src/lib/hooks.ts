"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction, setUser, setIsAuthenticated, setIsLoading } from '@/store/authSlice';
import React from 'react';
import { apiClient } from './api';
import { addNotification as addNotificationAction, removeNotification as removeNotificationAction, clearNotifications as clearNotificationsAction, openModal, closeModal, openConfirmModal, closeConfirmModal, setConfirmModalLoading } from '@/store/uiSlice';
import type { Notification } from '@/store/uiSlice';
import type { RootState } from '@/store/store';
import {
  loadPosts,
  createPost,
  updatePost,
  deletePost,
  setCurrentPost
} from '@/store/postsSlice';

// Auth hooks
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const isLoading = useAppSelector(state => state.auth.isLoading);
  const accessToken = useAppSelector(state => state.auth.accessToken);
  const hasHydrated = useAppSelector(state => state.auth.hasHydrated);

  // Ensure we have a valid authentication state after hydration
  const effectiveIsAuthenticated = hasHydrated ? isAuthenticated : false;
  const effectiveIsLoading = !hasHydrated || isLoading;

  const login = useCallback(async (email: string, password: string) => {
    dispatch(loginStart());
    try {
      const response = await apiClient.login({ email, password });
      dispatch(loginSuccess({ user: response.user, accessToken: response.access_token }));
      apiClient.setToken(response.access_token);
    } catch (error) {
      dispatch(loginFailure());
      throw error;
    }
  }, [dispatch]);

  const register = useCallback(async (userData: any) => {
    dispatch(loginStart());
    try {
      const response = await apiClient.register(userData);
      dispatch(loginSuccess({ user: response.user, accessToken: response.access_token }));
      apiClient.setToken(response.access_token);
    } catch (error) {
      dispatch(loginFailure());
      throw error;
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    dispatch(logoutAction());
    apiClient.clearAuth();
  }, [dispatch]);

  const refreshUser = useCallback(async () => {
    try {
      // Use the current user's ID if available, otherwise fallback to /me endpoint
      if (user && user.id) {
        const userData = await apiClient.getCurrentUser(user.id);
        if (userData) dispatch(setUser(userData));
      } else {
        const userData = await apiClient.getCurrentUser();
        if (userData) dispatch(setUser(userData));
      }
    } catch (error) {
      dispatch(logoutAction());
      throw error;
    }
  }, [dispatch, user?.id]);

  const updateUser = useCallback(async (userData: any) => {
    if (!user) return;
    try {
      const updatedUser = await apiClient.updateUser(user.id, userData);
      if (updatedUser) dispatch(setUser(updatedUser));
    } catch (error) {
      throw error;
    }
  }, [dispatch, user]);

  return {
    user,
    isAuthenticated: effectiveIsAuthenticated,
    isLoading: effectiveIsLoading,
    accessToken,
    hasHydrated,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  };
};

// Post hooks
export const usePosts = () => {
  const posts = useAppSelector(state => state.posts.posts);
  const currentPost = useAppSelector(state => state.posts.currentPost);
  const isLoading = useAppSelector(state => state.posts.isLoading);
  const error = useAppSelector(state => state.posts.error);
  const dispatch = useAppDispatch();
  return {
    posts,
    currentPost,
    isLoading,
    error,
    loadPosts: (organizationId: any) => dispatch(loadPosts(organizationId)),
    createPost: (data: any) => dispatch(createPost(data)),
    updatePost: (id: any, data: any) => {
      if (id !== undefined && data !== undefined) {
        // We need to get the organizationId from the active organization
        const state = (dispatch as any).getState();
        const activeOrganization = state.organizations.activeOrganization;
        if (!activeOrganization) {
          throw new Error('No active organization selected');
        }
        return dispatch(updatePost({ id, organizationId: activeOrganization.id, data }));
      }
      return undefined;
    },
    deletePost: (id: any) => {
      // We need to get the organizationId from the active organization
      const state = (dispatch as any).getState();
      const activeOrganization = state.organizations.activeOrganization;
      if (!activeOrganization) {
        throw new Error('No active organization selected');
      }
      return dispatch(deletePost({ id, organizationId: activeOrganization.id }));
    },
    setCurrentPost: (post: any) => dispatch(setCurrentPost(post)),
  };
};

// UI hooks
export const useUI = () => {
  const notifications = useAppSelector((state: RootState) => state.ui.notifications);
  const modals = useAppSelector((state: RootState) => state.ui.modals);
  const confirmModal = useAppSelector((state: RootState) => state.ui.confirmModal);
  const dispatch = useAppDispatch();
  return {
    notifications,
    modals,
    confirmModal,
    addNotification: (notification: Notification) => dispatch(addNotificationAction(notification)),
    removeNotification: (id: string) => dispatch(removeNotificationAction(id)),
    clearNotifications: () => dispatch(clearNotificationsAction()),
    openModal: (modal: 'createOrganization' | 'inviteMember') => dispatch(openModal(modal)),
    closeModal: (modal: 'createOrganization' | 'inviteMember') => dispatch(closeModal(modal)),
    openConfirmModal: (payload: Omit<RootState['ui']['confirmModal'], 'open'> & { onConfirm?: () => void }) => dispatch(openConfirmModal(payload)),
    closeConfirmModal: () => dispatch(closeConfirmModal()),
    setConfirmModalLoading: (loading: boolean) => dispatch(setConfirmModalLoading(loading)),
  };
};

// Permission hooks
export const usePermissions = () => {
  const user = useAppSelector((state: RootState) => state.auth.user);
  const activeOrganization = useAppSelector((state: RootState) => state.organizations.activeOrganization);
  // Try to get members from activeOrganization.members, fallback to []
  const members = activeOrganization?.members || [];
  // Find the current user's membership in the active org
  const currentMembership = user && members.find((m: any) => m.userId === user.id);
  const userRole = currentMembership?.role || 'viewer';
  const hasRole = (role: string) => userRole === role;
  const canInviteMembers = () => userRole === 'owner' || userRole === 'editor';
  return {
    userRole,
    hasRole,
    canInviteMembers,
  };
};

// App initialization hook
export const useAppInitialization = () => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(state => state.auth.accessToken);

  React.useEffect(() => {
    const initialize = async () => {
      dispatch(setIsLoading(true));
      const token = accessToken || localStorage.getItem('access_token');
      if (token) {
        apiClient.setToken(token);
        try {
          const userData = await apiClient.getCurrentUser();
          dispatch(setUser(userData));
          dispatch(setIsAuthenticated(true));
        } catch (e) {
          dispatch(setUser(null));
          dispatch(setIsAuthenticated(false));
          localStorage.removeItem('access_token');
        }
      } else {
        dispatch(setUser(null));
        dispatch(setIsAuthenticated(false));
      }
      dispatch(setIsLoading(false));
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

// Search hooks
export const useSearch = () => {
  const [searchResults, setSearchResults] = useState<{
    posts: any[];
    users: any[];
    organizations: any[];
  }>({
    posts: [],
    users: [],
    organizations: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const searchPosts = async (query: string) => {
    try {
      setIsLoading(true);
      const results = await apiClient.searchPosts(query);
      setSearchResults(prev => ({ ...prev, posts: (results.data || []) as any[] }));
    } catch (error) {
      console.error('Search posts error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    try {
      setIsLoading(true);
      const results = await apiClient.searchUsers(query);
      setSearchResults(prev => ({ ...prev, users: results.data || [] }));
    } catch (error) {
      console.error('Search users error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchAll = async (query: string) => {
    try {
      setIsLoading(true);
      const results = await apiClient.searchAll(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search all error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResults({
      posts: [],
      users: [],
      organizations: [],
    });
  };

  return {
    searchResults,
    isLoading,
    searchPosts,
    searchUsers,
    searchAll,
    clearSearch,
  };
};

// Combined hook for all state
// export const useAppState = () => {
//   const auth = useAuth();
//   const posts = usePosts();
//   const ui = useUI();
//   const permissions = usePermissions();
//   const appInit = useAppInitialization();
//
//   return {
//     ...auth,
//     ...posts,
//     ...ui,
//     ...permissions,
//     ...appInit,
//   };
// };

export function useAuthInitialization() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(state => state.auth.accessToken);
  const hasHydrated = useAppSelector(state => state.auth.hasHydrated);

  React.useEffect(() => {
    if (!hasHydrated) return; // Wait for hydration before initializing

    const initialize = async () => {
      console.log('Auth initialization starting...');
      dispatch(setIsLoading(true));
      const token = accessToken || localStorage.getItem('access_token');
      console.log('Token found:', !!token);
      
      if (token) {
        apiClient.setToken(token);
        try {
          // During initialization, always use the /me endpoint first
          console.log('Calling getCurrentUser...');
          const userData = await apiClient.getCurrentUser();
          console.log('User data received:', userData);
          dispatch(setUser(userData));
          dispatch(setIsAuthenticated(true));
        } catch (e) {
          console.error('Auth initialization error:', e);
          // Only set to false if we're sure the token is invalid
          dispatch(setUser(null));
          dispatch(setIsAuthenticated(false));
          localStorage.removeItem('access_token');
        }
      }
      dispatch(setIsLoading(false));
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]); // Only depend on hasHydrated
} 