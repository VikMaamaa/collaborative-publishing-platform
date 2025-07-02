import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Organization, OrganizationMember, Post, Invitation, CreateInvitationData } from '@/types';
import { apiClient } from './api';

// Types for our store
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface OrganizationState {
  organizations: Organization[];
  activeOrganization: Organization | null;
  organizationMembers: OrganizationMember[];
  userRole: string | null;
  userPermissions: string[];
}

interface PostState {
  posts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
}

interface InvitationState {
  organizationInvitations: Invitation[];
  userInvitations: Invitation[];
  isLoadingInvitations: boolean;
}

interface ConfirmModalState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  loading?: boolean;
}

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  modals: {
    createOrganization: boolean;
    inviteMember: boolean;
  };
  confirmModal: ConfirmModalState;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Combined store interface
interface AppStore extends AuthState, OrganizationState, PostState, InvitationState, UIState {
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  
  // Organization actions
  setActiveOrganization: (organization: Organization) => void;
  loadOrganizations: () => Promise<void>;
  createOrganization: (data: any) => Promise<Organization>;
  updateOrganization: (id: string, data: any) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  loadOrganizationMembers: (organizationId: string) => Promise<void>;
  inviteMember: (organizationId: string, email: string, role: string) => Promise<void>;
  updateMemberRole: (organizationId: string, userId: string, role: string) => Promise<void>;
  removeMember: (organizationId: string, userId: string) => Promise<void>;
  
  // Invitation actions
  loadOrganizationInvitations: (organizationId: string) => Promise<void>;
  createInvitation: (organizationId: string, invitationData: CreateInvitationData) => Promise<Invitation>;
  resendInvitation: (organizationId: string, invitationId: string) => Promise<void>;
  cancelInvitation: (organizationId: string, invitationId: string) => Promise<void>;
  loadUserInvitations: () => Promise<void>;
  acceptInvitation: (token: string) => Promise<void>;
  
  // Post actions
  loadPosts: (organizationId?: string) => Promise<void>;
  createPost: (data: any) => Promise<void>;
  updatePost: (id: string, data: any) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  setCurrentPost: (post: Post | null) => void;
  
  // UI actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  openConfirmModal: (options: Omit<ConfirmModalState, 'open' | 'loading'> & { onConfirm: () => Promise<void> }) => void;
  closeConfirmModal: () => void;
  
  // Utility actions
  initializeApp: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  
  // Convenience post status actions
  submitPost: (id: string) => Promise<void>;
  approvePost: (id: string) => Promise<void>;
  publishPost: (id: string) => Promise<void>;
}

// Permission and role constants
export const PERMISSIONS = {
  // Post permissions
  POST_CREATE: 'post:create',
  POST_READ: 'post:read',
  POST_UPDATE: 'post:update',
  POST_DELETE: 'post:delete',
  POST_PUBLISH: 'post:publish',
  
  // Organization permissions
  ORG_MANAGE: 'org:manage',
  ORG_MEMBERS: 'org:members',
  ORG_SETTINGS: 'org:settings',
  
  // User permissions
  USER_MANAGE: 'user:manage',
  USER_PROFILE: 'user:profile',
} as const;

export const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  WRITER: 'writer',
  VIEWER: 'viewer',
} as const;

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  [ROLES.OWNER]: 4,
  [ROLES.EDITOR]: 3,
  [ROLES.WRITER]: 2,
  [ROLES.VIEWER]: 1,
};

// Permission mapping to roles
const PERMISSION_ROLES = {
  [PERMISSIONS.POST_CREATE]: [ROLES.OWNER, ROLES.EDITOR, ROLES.WRITER],
  [PERMISSIONS.POST_READ]: [ROLES.OWNER, ROLES.EDITOR, ROLES.WRITER, ROLES.VIEWER],
  [PERMISSIONS.POST_UPDATE]: [ROLES.OWNER, ROLES.EDITOR, ROLES.WRITER],
  [PERMISSIONS.POST_DELETE]: [ROLES.OWNER, ROLES.EDITOR],
  [PERMISSIONS.POST_PUBLISH]: [ROLES.OWNER, ROLES.EDITOR],
  [PERMISSIONS.ORG_MANAGE]: [ROLES.OWNER],
  [PERMISSIONS.ORG_MEMBERS]: [ROLES.OWNER, ROLES.EDITOR],
  [PERMISSIONS.ORG_SETTINGS]: [ROLES.OWNER],
  [PERMISSIONS.USER_MANAGE]: [ROLES.OWNER],
  [PERMISSIONS.USER_PROFILE]: [ROLES.OWNER, ROLES.EDITOR, ROLES.WRITER, ROLES.VIEWER],
};

// Create the store
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      
      organizations: [],
      activeOrganization: null,
      organizationMembers: [],
      userRole: null,
      userPermissions: [],
      
      posts: [],
      currentPost: null,
      
      organizationInvitations: [],
      userInvitations: [],
      isLoadingInvitations: false,
      
      sidebarOpen: false,
      theme: 'light',
      notifications: [],
      
      modals: {
        createOrganization: false,
        inviteMember: false,
      },
      confirmModal: {
        open: false,
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        onConfirm: undefined,
        loading: false,
      },
      
      // Auth actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.login({ email, password });
          
          set({
            user: response.user,
            accessToken: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Load user's organizations after login
          await get().loadOrganizations();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      register: async (userData: any) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.register(userData);
          
          set({
            user: response.user,
            accessToken: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Load user's organizations after registration
          await get().loadOrganizations();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          organizations: [],
          activeOrganization: null,
          organizationMembers: [],
          userRole: null,
          userPermissions: [],
          posts: [],
          currentPost: null,
        });
        
        // Clear localStorage
        localStorage.removeItem('access_token');
      },
      
      refreshUser: async () => {
        try {
          const userData = await apiClient.getCurrentUser();
          set({ user: userData });
        } catch (error) {
          get().logout();
          throw error;
        }
      },
      
      updateUser: async (userData: Partial<User>) => {
        try {
          const { user } = get();
          if (!user) throw new Error('No user logged in');
          
          const updatedUser = await apiClient.updateUser(user.id, userData);
          set({ user: updatedUser });
        } catch (error) {
          throw error;
        }
      },
      
      // Organization actions
      setActiveOrganization: (organization: Organization) => {
        set({ activeOrganization: organization });
        // Load organization members and posts when switching organizations
        get().loadOrganizationMembers(organization.id);
        get().loadPosts(organization.id);
      },
      
      loadOrganizations: async () => {
        try {
          const organizations = await apiClient.getOrganizations();
          set({ organizations });
          
          // Set first organization as active if none is selected
          if (organizations.length > 0 && !get().activeOrganization) {
            get().setActiveOrganization(organizations[0]);
          }
        } catch (error) {
          console.error('Failed to load organizations:', error);
        }
      },
      
      createOrganization: async (data: any) => {
        try {
          const newOrg = await apiClient.createOrganization(data);
          set(state => ({
            organizations: [...state.organizations, newOrg],
          }));
          // Set as active organization if it's the first one
          if (get().organizations.length === 1) {
            get().setActiveOrganization(newOrg);
          }
          return newOrg;
        } catch (error) {
          throw error;
        }
      },
      
      updateOrganization: async (id: string, data: any) => {
        try {
          const updatedOrg = await apiClient.updateOrganization(id, data);
          set(state => ({
            organizations: state.organizations.map(org => 
              org.id === id ? updatedOrg : org
            ),
            activeOrganization: state.activeOrganization?.id === id ? updatedOrg : state.activeOrganization,
          }));
        } catch (error) {
          throw error;
        }
      },
      
      deleteOrganization: async (id: string) => {
        try {
          await apiClient.deleteOrganization(id);
          set(state => {
            const newOrganizations = state.organizations.filter(org => org.id !== id);
            return {
              organizations: newOrganizations,
              activeOrganization: state.activeOrganization?.id === id 
                ? (newOrganizations[0] || null) 
                : state.activeOrganization,
            };
          });
        } catch (error) {
          throw error;
        }
      },
      
      loadOrganizationMembers: async (organizationId: string) => {
        try {
          // This would need to be implemented in the API client
          // const members = await apiClient.getOrganizationMembers(organizationId);
          // set({ organizationMembers: members });
          
          // For now, we'll set a default role based on the user
          const { user } = get();
          if (user) {
            // This is a simplified approach - in reality, you'd get this from the API
            set({ userRole: ROLES.OWNER });
          }
        } catch (error) {
          console.error('Failed to load organization members:', error);
        }
      },
      
      inviteMember: async (organizationId: string, email: string, role: string) => {
        // Optimistically add a pending member
        const pendingId = 'pending-' + Math.random().toString(36).substr(2, 9);
        const pendingMember = {
          id: pendingId,
          userId: pendingId,
          organizationId,
          role: role as OrganizationMember['role'],
          isActive: true,
          invitedEmail: email,
          user: { id: pendingId, email, username: email, firstName: '', lastName: '', createdAt: '', updatedAt: '' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pending: true,
        };
        set(state => ({
          organizationMembers: [...state.organizationMembers, pendingMember],
        }));
        try {
          await apiClient.inviteMember(organizationId, email, role);
          // Refresh organization members
          await get().loadOrganizationMembers(organizationId);
        } catch (error) {
          // Rollback: remove pending member
          set(state => ({
            organizationMembers: state.organizationMembers.filter(m => m.id !== pendingId),
          }));
          get().addNotification({
            type: 'error',
            message: (error as any).message || 'Failed to send invitation. Please try again.',
            duration: 5000,
          });
          throw error;
        }
      },
      
      updateMemberRole: async (organizationId: string, userId: string, role: string) => {
        try {
          await apiClient.updateMemberRole(organizationId, userId, role);
          // Refresh organization members
          get().loadOrganizationMembers(organizationId);
        } catch (error) {
          throw error;
        }
      },
      
      removeMember: async (organizationId: string, userId: string) => {
        // Optimistically remove member
        const prevMembers = get().organizationMembers;
        const removedMember = prevMembers.find(m => m.userId === userId);
        set(state => ({
          organizationMembers: state.organizationMembers.filter(m => m.userId !== userId),
        }));
        try {
          await apiClient.removeMember(organizationId, userId);
          // Refresh organization members
          await get().loadOrganizationMembers(organizationId);
        } catch (error) {
          // Rollback
          set(state => ({
            organizationMembers: removedMember ? [...state.organizationMembers, removedMember] : state.organizationMembers,
          }));
          get().addNotification({
            type: 'error',
            message: (error as any).message || 'Failed to remove member. Changes reverted.',
            duration: 4000,
          });
          throw error;
        }
      },
      
      // Invitation actions
      loadOrganizationInvitations: async (organizationId: string) => {
        try {
          set({ isLoadingInvitations: true });
          const invitations = await apiClient.getOrganizationInvitations(organizationId);
          set({ organizationInvitations: invitations });
        } catch (error) {
          get().addNotification({
            type: 'error',
            message: (error as any).message || 'Failed to load invitations',
          });
          throw error;
        } finally {
          set({ isLoadingInvitations: false });
        }
      },
      
      createInvitation: async (organizationId: string, invitationData: CreateInvitationData) => {
        try {
          const invitation = await apiClient.createInvitation(organizationId, invitationData);
          set(state => ({
            organizationInvitations: [...state.organizationInvitations, invitation],
          }));
          get().addNotification({
            type: 'success',
            message: `Invitation sent to ${invitationData.email}`,
          });
          return invitation;
        } catch (error) {
          get().addNotification({
            type: 'error',
            message: (error as any).message || 'Failed to create invitation',
          });
          throw error;
        }
      },
      
      resendInvitation: async (organizationId: string, invitationId: string) => {
        try {
          const updatedInvitation = await apiClient.resendInvitation(organizationId, invitationId);
          set(state => ({
            organizationInvitations: state.organizationInvitations.map(inv => 
              inv.id === invitationId ? updatedInvitation : inv
            ),
          }));
          get().addNotification({
            type: 'success',
            message: 'Invitation resent successfully',
          });
        } catch (error) {
          get().addNotification({
            type: 'error',
            message: (error as any).message || 'Failed to resend invitation',
          });
          throw error;
        }
      },
      
      cancelInvitation: async (organizationId: string, invitationId: string) => {
        try {
          await apiClient.cancelInvitation(organizationId, invitationId);
          set(state => ({
            organizationInvitations: state.organizationInvitations.filter(inv => inv.id !== invitationId),
          }));
          get().addNotification({
            type: 'success',
            message: 'Invitation canceled successfully',
          });
        } catch (error) {
          get().addNotification({
            type: 'error',
            message: (error as any).message || 'Failed to cancel invitation',
          });
          throw error;
        }
      },
      
      loadUserInvitations: async () => {
        try {
          set({ isLoadingInvitations: true });
          const invitations = await apiClient.getUserInvitations();
          set({ userInvitations: invitations });
        } catch (error) {
          get().addNotification({
            type: 'error',
            message: (error as any).message || 'Failed to load user invitations',
          });
          throw error;
        } finally {
          set({ isLoadingInvitations: false });
        }
      },
      
      acceptInvitation: async (token: string) => {
        try {
          await apiClient.acceptInvitation({ token });
          get().addNotification({
            type: 'success',
            message: 'Invitation accepted successfully',
          });
          // Reload user's organizations
          await get().loadOrganizations();
        } catch (error) {
          get().addNotification({
            type: 'error',
            message: (error as any).message || 'Failed to accept invitation',
          });
          throw error;
        }
      },
      
      // Post actions
      loadPosts: async (organizationId?: string) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.getPosts(organizationId ? { organizationId } : undefined);
          // If response is PaginatedResponse<Post>, use response.items
          set({ posts: Array.isArray(response) ? response : response.items, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      createPost: async (data: any) => {
        try {
          const newPost = await apiClient.createPost(data);
          set(state => ({
            posts: [...state.posts, newPost],
          }));
        } catch (error) {
          throw error;
        }
      },
      
      updatePost: async (id: string, data: any) => {
        const prevPosts = get().posts;
        const prevPost = prevPosts.find(post => post.id === id);
        if (!prevPost) throw new Error('Post not found');
        // Optimistically update post in store
        const optimisticPost = { ...prevPost, ...data };
        set(state => ({
          posts: state.posts.map(post => post.id === id ? optimisticPost : post),
          currentPost: state.currentPost?.id === id ? optimisticPost : state.currentPost,
        }));
        try {
          const updatedPost = await apiClient.updatePost(id, data);
          set(state => ({
            posts: state.posts.map(post => post.id === id ? updatedPost : post),
            currentPost: state.currentPost?.id === id ? updatedPost : state.currentPost,
          }));
        } catch (error) {
          // Rollback
          set(state => ({
            posts: state.posts.map(post => post.id === id ? prevPost : post),
            currentPost: state.currentPost?.id === id ? prevPost : state.currentPost,
          }));
          get().addNotification({
            type: 'error',
            message: (error as any).message || 'Failed to update post. Changes reverted.',
            duration: 4000,
          });
          throw error;
        }
      },
      
      deletePost: async (id: string) => {
        // Optimistically remove post
        const prevPosts = get().posts;
        const removedPost = prevPosts.find(post => post.id === id);
        set(state => ({
          posts: state.posts.filter(post => post.id !== id),
          currentPost: state.currentPost?.id === id ? null : state.currentPost,
        }));
        try {
          await apiClient.deletePost(id);
        } catch (error) {
          // Rollback
          set(state => ({
            posts: removedPost ? [...state.posts, removedPost] : state.posts,
            currentPost: state.currentPost?.id === id ? removedPost : state.currentPost,
          }));
          get().addNotification({
            type: 'error',
            message: (error as any).message || 'Failed to delete post. Changes reverted.',
            duration: 4000,
          });
          throw error;
        }
      },
      
      setCurrentPost: (post: Post | null) => {
        set({ currentPost: post });
      },
      
      // UI actions
      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }));
      },
      
      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
        // Apply theme to document
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
      
      addNotification: (notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = { ...notification, id };
        
        set(state => ({
          notifications: [...state.notifications, newNotification],
        }));
        
        // Auto-remove notification after duration
        if (notification.duration !== undefined) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);
        }
      },
      
      removeNotification: (id: string) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
      },
      
      openModal: (modal: keyof UIState['modals']) => {
        set(state => ({
          modals: {
            ...state.modals,
            [modal]: true,
          },
        }));
      },
      
      closeModal: (modal: keyof UIState['modals']) => {
        set(state => ({
          modals: {
            ...state.modals,
            [modal]: false,
          },
        }));
      },
      
      openConfirmModal: (options: Omit<ConfirmModalState, 'open' | 'loading'> & { onConfirm: () => Promise<void> }) => {
        set({
          confirmModal: {
            open: true,
            title: options.title,
            message: options.message,
            confirmLabel: options.confirmLabel || 'Confirm',
            cancelLabel: options.cancelLabel || 'Cancel',
            onConfirm: async () => {
              set(state => ({ confirmModal: { ...state.confirmModal, loading: true } }));
              try {
                await options.onConfirm();
                set({ confirmModal: { ...get().confirmModal, open: false, loading: false } });
              } catch (e) {
                set(state => ({ confirmModal: { ...state.confirmModal, loading: false } }));
                throw e;
              }
            },
            loading: false,
          },
        });
      },
      
      closeConfirmModal: () => {
        set(state => ({
          confirmModal: { ...state.confirmModal, open: false, loading: false },
        }));
      },
      
      // Utility actions
      initializeApp: async () => {
        try {
          set({ isLoading: true });
          
          // Check for existing token
          const token = localStorage.getItem('access_token');
          if (token) {
            // Set token in API client
            // apiClient.setToken(token);
            
            // Refresh user data
            await get().refreshUser();
            
            // Load organizations
            await get().loadOrganizations();
          }
        } catch (error) {
          console.error('Failed to initialize app:', error);
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },
      
      hasPermission: (permission: string) => {
        const { userRole } = get();
        if (!userRole) return false;
        
        const allowedRoles = PERMISSION_ROLES[permission as keyof typeof PERMISSION_ROLES];
        if (!allowedRoles) return false;
        
        return allowedRoles.includes(userRole as any);
      },
      
      hasRole: (role: string) => {
        const { userRole } = get();
        if (!userRole) return false;
        
        const userRoleLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY];
        const requiredRoleLevel = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY];
        
        return userRoleLevel >= requiredRoleLevel;
      },
      
      // Convenience post status actions
      submitPost: async (id: string) => {
        await get().updatePost(id, { status: 'in_review' });
      },
      approvePost: async (id: string) => {
        await get().updatePost(id, { status: 'published' });
      },
      publishPost: async (id: string) => {
        await get().updatePost(id, { status: 'published' });
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist certain parts of the state
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        activeOrganization: state.activeOrganization,
      }),
    }
  )
); 