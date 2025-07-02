import { useState } from 'react';
import { useAppStore, PERMISSIONS, ROLES } from './store';
import { apiClient } from './api';

// Auth hooks
export const useAuth = () => {
  const user = useAppStore(state => state.user);
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const isLoading = useAppStore(state => state.isLoading);
  const login = useAppStore(state => state.login);
  const register = useAppStore(state => state.register);
  const logout = useAppStore(state => state.logout);
  const refreshUser = useAppStore(state => state.refreshUser);
  const updateUser = useAppStore(state => state.updateUser);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  };
};

// Organization hooks
export const useOrganizations = () => {
  const organizations = useAppStore(state => state.organizations);
  const activeOrganization = useAppStore(state => state.activeOrganization);
  const organizationMembers = useAppStore(state => state.organizationMembers);
  const userRole = useAppStore(state => state.userRole);
  const userPermissions = useAppStore(state => state.userPermissions);
  
  // Invitation state
  const organizationInvitations = useAppStore(state => state.organizationInvitations);
  const userInvitations = useAppStore(state => state.userInvitations);
  const isLoadingInvitations = useAppStore(state => state.isLoadingInvitations);
  
  const setActiveOrganization = useAppStore(state => state.setActiveOrganization);
  const loadOrganizations = useAppStore(state => state.loadOrganizations);
  const createOrganization = useAppStore(state => state.createOrganization);
  const updateOrganization = useAppStore(state => state.updateOrganization);
  const deleteOrganization = useAppStore(state => state.deleteOrganization);
  const loadOrganizationMembers = useAppStore(state => state.loadOrganizationMembers);
  const inviteMember = useAppStore(state => state.inviteMember);
  const updateMemberRole = useAppStore(state => state.updateMemberRole);
  const removeMember = useAppStore(state => state.removeMember);
  
  // Invitation actions
  const loadOrganizationInvitations = useAppStore(state => state.loadOrganizationInvitations);
  const createInvitation = useAppStore(state => state.createInvitation);
  const resendInvitation = useAppStore(state => state.resendInvitation);
  const cancelInvitation = useAppStore(state => state.cancelInvitation);
  const loadUserInvitations = useAppStore(state => state.loadUserInvitations);
  const acceptInvitation = useAppStore(state => state.acceptInvitation);

  return {
    organizations,
    activeOrganization,
    organizationMembers,
    userRole,
    userPermissions,
    organizationInvitations,
    userInvitations,
    isLoadingInvitations,
    setActiveOrganization,
    loadOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    loadOrganizationMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
    loadOrganizationInvitations,
    createInvitation,
    resendInvitation,
    cancelInvitation,
    loadUserInvitations,
    acceptInvitation,
  };
};

// Enhanced Organization hooks with notifications
export const useOrganizationsWithNotifications = () => {
  const organizations = useOrganizations();
  const ui = useUI();

  const createOrganizationWithNotification = async (data: any) => {
    try {
      await organizations.createOrganization(data);
      ui.addNotification({
        type: 'success',
        message: 'Organization created successfully!',
        duration: 4000,
      });
    } catch (error) {
      ui.addNotification({
        type: 'error',
        message: 'Failed to create organization. Please try again.',
        duration: 4000,
      });
      throw error;
    }
  };

  const deleteOrganizationWithConfirmation = (organizationId: string, organizationName: string) => {
    ui.openConfirmModal({
      title: 'Delete Organization',
      message: `Are you sure you want to delete "${organizationName}"? This action cannot be undone and will remove all data for this organization.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        try {
          await organizations.deleteOrganization(organizationId);
          ui.addNotification({
            type: 'success',
            message: `Organization "${organizationName}" deleted successfully`,
            duration: 4000,
          });
        } catch (error) {
          ui.addNotification({
            type: 'error',
            message: 'Failed to delete organization. Please try again.',
            duration: 4000,
          });
        }
      },
    });
  };

  const inviteMemberWithNotification = async (organizationId: string, invitationData: any) => {
    try {
      await organizations.createInvitation(organizationId, invitationData);
      ui.addNotification({
        type: 'success',
        message: 'Invitation sent successfully!',
        duration: 4000,
      });
    } catch (error) {
      ui.addNotification({
        type: 'error',
        message: 'Failed to send invitation. Please try again.',
        duration: 4000,
      });
      throw error;
    }
  };

  const resendInvitationWithNotification = async (organizationId: string, invitationId: string) => {
    try {
      await organizations.resendInvitation(organizationId, invitationId);
      ui.addNotification({
        type: 'success',
        message: 'Invitation resent successfully!',
        duration: 4000,
      });
    } catch (error) {
      ui.addNotification({
        type: 'error',
        message: 'Failed to resend invitation. Please try again.',
        duration: 4000,
      });
      throw error;
    }
  };

  const cancelInvitationWithConfirmation = (organizationId: string, invitationId: string, email: string) => {
    ui.openConfirmModal({
      title: 'Cancel Invitation',
      message: `Are you sure you want to cancel the invitation for ${email}?`,
      confirmLabel: 'Cancel Invitation',
      cancelLabel: 'Keep Invitation',
      onConfirm: async () => {
        try {
          await organizations.cancelInvitation(organizationId, invitationId);
          ui.addNotification({
            type: 'success',
            message: 'Invitation cancelled successfully',
            duration: 4000,
          });
        } catch (error) {
          ui.addNotification({
            type: 'error',
            message: 'Failed to cancel invitation. Please try again.',
            duration: 4000,
          });
        }
      },
    });
  };

  const acceptInvitationWithNotification = async (token: string) => {
    try {
      await organizations.acceptInvitation(token);
      ui.addNotification({
        type: 'success',
        message: 'Invitation accepted successfully! Welcome to the organization.',
        duration: 4000,
      });
    } catch (error) {
      ui.addNotification({
        type: 'error',
        message: 'Failed to accept invitation. Please try again.',
        duration: 4000,
      });
      throw error;
    }
  };

  const removeMemberWithConfirmation = (organizationId: string, memberId: string, memberName: string) => {
    ui.openConfirmModal({
      title: 'Remove Member',
      message: `Are you sure you want to remove ${memberName} from the organization?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        try {
          await organizations.removeMember(organizationId, memberId);
          ui.addNotification({
            type: 'success',
            message: `${memberName} has been removed from the organization`,
            duration: 4000,
          });
        } catch (error) {
          ui.addNotification({
            type: 'error',
            message: 'Failed to remove member. Please try again.',
            duration: 4000,
          });
        }
      },
    });
  };

  return {
    ...organizations,
    createOrganizationWithNotification,
    deleteOrganizationWithConfirmation,
    inviteMemberWithNotification,
    resendInvitationWithNotification,
    cancelInvitationWithConfirmation,
    acceptInvitationWithNotification,
    removeMemberWithConfirmation,
  };
};

// Post hooks
export const usePosts = () => {
  const posts = useAppStore(state => state.posts);
  const currentPost = useAppStore(state => state.currentPost);
  const isLoading = useAppStore(state => state.isLoading);
  
  const loadPosts = useAppStore(state => state.loadPosts);
  const createPost = useAppStore(state => state.createPost);
  const updatePost = useAppStore(state => state.updatePost);
  const deletePost = useAppStore(state => state.deletePost);
  const setCurrentPost = useAppStore(state => state.setCurrentPost);

  return {
    posts,
    currentPost,
    isLoading,
    loadPosts,
    createPost,
    updatePost,
    deletePost,
    setCurrentPost,
  };
};

// Enhanced Post hooks with notifications
export const usePostsWithNotifications = () => {
  const posts = usePosts();
  const ui = useUI();

  const createPostWithNotification = async (data: any) => {
    try {
      await posts.createPost(data);
      ui.addNotification({
        type: 'success',
        message: 'Post created successfully!',
        duration: 4000,
      });
    } catch (error) {
      ui.addNotification({
        type: 'error',
        message: 'Failed to create post. Please try again.',
        duration: 4000,
      });
      throw error;
    }
  };

  const updatePostWithNotification = async (postId: string, data: any) => {
    try {
      await posts.updatePost(postId, data);
      ui.addNotification({
        type: 'success',
        message: 'Post updated successfully!',
        duration: 4000,
      });
    } catch (error) {
      ui.addNotification({
        type: 'error',
        message: 'Failed to update post. Please try again.',
        duration: 4000,
      });
      throw error;
    }
  };

  const deletePostWithConfirmation = (postId: string, postTitle: string) => {
    ui.openConfirmModal({
      title: 'Delete Post',
      message: `Are you sure you want to delete "${postTitle}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        try {
          await posts.deletePost(postId);
          ui.addNotification({
            type: 'success',
            message: 'Post deleted successfully',
            duration: 4000,
          });
        } catch (error) {
          ui.addNotification({
            type: 'error',
            message: 'Failed to delete post. Please try again.',
            duration: 4000,
          });
        }
      },
    });
  };

  return {
    ...posts,
    createPostWithNotification,
    updatePostWithNotification,
    deletePostWithConfirmation,
  };
};

// UI hooks
export const useUI = () => {
  const sidebarOpen = useAppStore(state => state.sidebarOpen);
  const theme = useAppStore(state => state.theme);
  const notifications = useAppStore(state => state.notifications);
  const modals = useAppStore(state => state.modals);
  
  const toggleSidebar = useAppStore(state => state.toggleSidebar);
  const setTheme = useAppStore(state => state.setTheme);
  const addNotification = useAppStore(state => state.addNotification);
  const removeNotification = useAppStore(state => state.removeNotification);
  const clearNotifications = useAppStore(state => state.clearNotifications);
  const openModal = useAppStore(state => state.openModal);
  const closeModal = useAppStore(state => state.closeModal);
  const openConfirmModal = useAppStore(state => state.openConfirmModal);
  const closeConfirmModal = useAppStore(state => state.closeConfirmModal);

  return {
    sidebarOpen,
    theme,
    notifications,
    modals,
    toggleSidebar,
    setTheme,
    addNotification,
    removeNotification,
    clearNotifications,
    openModal,
    closeModal,
    openConfirmModal,
    closeConfirmModal,
  };
};

// Permission hooks
export const usePermissions = () => {
  const hasPermission = useAppStore(state => state.hasPermission);
  const hasRole = useAppStore(state => state.hasRole);
  const userRole = useAppStore(state => state.userRole);

  return {
    hasPermission,
    hasRole,
    userRole,
    // Convenience methods for common permissions
    canCreatePost: () => hasPermission(PERMISSIONS.POST_CREATE),
    canReadPost: () => hasPermission(PERMISSIONS.POST_READ),
    canUpdatePost: () => hasPermission(PERMISSIONS.POST_UPDATE),
    canDeletePost: () => hasPermission(PERMISSIONS.POST_DELETE),
    canPublishPost: () => hasPermission(PERMISSIONS.POST_PUBLISH),
    canManageOrg: () => hasPermission(PERMISSIONS.ORG_MANAGE),
    canManageMembers: () => hasPermission(PERMISSIONS.ORG_MEMBERS),
    canInviteMembers: () => hasPermission(PERMISSIONS.ORG_MEMBERS),
    canManageSettings: () => hasPermission(PERMISSIONS.ORG_SETTINGS),
    canManageUsers: () => hasPermission(PERMISSIONS.USER_MANAGE),
    canManageProfile: () => hasPermission(PERMISSIONS.USER_PROFILE),
    // Role checks
    isOwner: () => hasRole(ROLES.OWNER),
    isEditor: () => hasRole(ROLES.EDITOR),
    isWriter: () => hasRole(ROLES.WRITER),
    isViewer: () => hasRole(ROLES.VIEWER),
  };
};

// App initialization hook
export const useAppInitialization = () => {
  const initializeApp = useAppStore(state => state.initializeApp);
  const isLoading = useAppStore(state => state.isLoading);

  return {
    initializeApp,
    isLoading,
  };
};

// Search hooks
export const useSearch = () => {
  const [searchResults, setSearchResults] = useState({
    posts: [],
    users: [],
    organizations: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const searchPosts = async (query: string) => {
    try {
      setIsLoading(true);
      const results = await apiClient.searchPosts(query);
      setSearchResults(prev => ({ ...prev, posts: results.data || [] }));
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
export const useAppState = () => {
  const auth = useAuth();
  const organizations = useOrganizations();
  const posts = usePosts();
  const ui = useUI();
  const permissions = usePermissions();
  const appInit = useAppInitialization();

  return {
    ...auth,
    ...organizations,
    ...posts,
    ...ui,
    ...permissions,
    ...appInit,
  };
}; 