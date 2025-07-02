import { ROLES, PERMISSIONS } from './store';

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  [ROLES.OWNER]: 4,
  [ROLES.EDITOR]: 3,
  [ROLES.WRITER]: 2,
  [ROLES.VIEWER]: 1,
} as const;

// Permission to role mapping
export const PERMISSION_ROLES = {
  // Post permissions
  [PERMISSIONS.POST_CREATE]: [ROLES.OWNER, ROLES.EDITOR, ROLES.WRITER],
  [PERMISSIONS.POST_READ]: [ROLES.OWNER, ROLES.EDITOR, ROLES.WRITER, ROLES.VIEWER],
  [PERMISSIONS.POST_UPDATE]: [ROLES.OWNER, ROLES.EDITOR, ROLES.WRITER],
  [PERMISSIONS.POST_DELETE]: [ROLES.OWNER, ROLES.EDITOR],
  [PERMISSIONS.POST_PUBLISH]: [ROLES.OWNER, ROLES.EDITOR],
  
  // Organization permissions
  [PERMISSIONS.ORG_MANAGE]: [ROLES.OWNER],
  [PERMISSIONS.ORG_MEMBERS]: [ROLES.OWNER, ROLES.EDITOR],
  [PERMISSIONS.ORG_SETTINGS]: [ROLES.OWNER],
  
  // User permissions
  [PERMISSIONS.USER_MANAGE]: [ROLES.OWNER],
  [PERMISSIONS.USER_PROFILE]: [ROLES.OWNER, ROLES.EDITOR, ROLES.WRITER, ROLES.VIEWER],
} as const;

// Permission checking utilities
export class PermissionChecker {
  private userRole: string | null;
  private userPermissions: string[];
  private organizationId: string | null;

  constructor(userRole: string | null, userPermissions: string[] = [], organizationId: string | null = null) {
    this.userRole = userRole;
    this.userPermissions = userPermissions;
    this.organizationId = organizationId;
  }

  // Check if user has a specific permission
  hasPermission(permission: string): boolean {
    if (!this.userRole) return false;
    
    const allowedRoles = PERMISSION_ROLES[permission as keyof typeof PERMISSION_ROLES];
    if (!allowedRoles) return false;
    
    return allowedRoles.includes(this.userRole as any);
  }

  // Check if user has a specific role or higher
  hasRole(role: string): boolean {
    if (!this.userRole) return false;
    
    const userRoleLevel = ROLE_HIERARCHY[this.userRole as keyof typeof ROLE_HIERARCHY];
    const requiredRoleLevel = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY];
    
    return userRoleLevel >= requiredRoleLevel;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  // Check if user has all of the specified permissions
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Get user's role level
  getRoleLevel(): number {
    if (!this.userRole) return 0;
    return ROLE_HIERARCHY[this.userRole as keyof typeof ROLE_HIERARCHY] || 0;
  }

  // Check if user can manage another user's role
  canManageRole(targetRole: string): boolean {
    if (!this.userRole) return false;
    
    const userRoleLevel = ROLE_HIERARCHY[this.userRole as keyof typeof ROLE_HIERARCHY];
    const targetRoleLevel = ROLE_HIERARCHY[targetRole as keyof typeof ROLE_HIERARCHY];
    
    // Users can only manage roles at or below their own level
    return userRoleLevel > targetRoleLevel;
  }

  // Check if user can perform action in organization
  canInOrganization(permission: string, orgId: string): boolean {
    // For now, assume same organization. In the future, this could check cross-org permissions
    return this.organizationId === orgId && this.hasPermission(permission);
  }
}

// Factory with cross-org permissions
export const createPermissionChecker = (
  userRole: string | null, 
  userPermissions: string[] = [], 
  organizationId: string | null = null
) => new PermissionChecker(userRole, userPermissions, organizationId);

// Common permission checks
export const canCreatePost = (userRole: string | null) => 
  createPermissionChecker(userRole).hasPermission(PERMISSIONS.POST_CREATE);

export const canReadPost = (userRole: string | null) => 
  createPermissionChecker(userRole).hasPermission(PERMISSIONS.POST_READ);

export const canUpdatePost = (userRole: string | null) => 
  createPermissionChecker(userRole).hasPermission(PERMISSIONS.POST_UPDATE);

export const canDeletePost = (userRole: string | null) => 
  createPermissionChecker(userRole).hasPermission(PERMISSIONS.POST_DELETE);

export const canPublishPost = (userRole: string | null) => 
  createPermissionChecker(userRole).hasPermission(PERMISSIONS.POST_PUBLISH);

export const canManageOrg = (userRole: string | null) => 
  createPermissionChecker(userRole).hasPermission(PERMISSIONS.ORG_MANAGE);

export const canManageMembers = (userRole: string | null) => 
  createPermissionChecker(userRole).hasPermission(PERMISSIONS.ORG_MEMBERS);

export const canManageSettings = (userRole: string | null) => 
  createPermissionChecker(userRole).hasPermission(PERMISSIONS.ORG_SETTINGS);

export const canManageUsers = (userRole: string | null) => 
  createPermissionChecker(userRole).hasPermission(PERMISSIONS.USER_MANAGE);

// Role checks
export const isOwner = (userRole: string | null) => 
  createPermissionChecker(userRole).hasRole(ROLES.OWNER);

export const isEditor = (userRole: string | null) => 
  createPermissionChecker(userRole).hasRole(ROLES.EDITOR);

export const isWriter = (userRole: string | null) => 
  createPermissionChecker(userRole).hasRole(ROLES.WRITER);

export const isViewer = (userRole: string | null) => 
  createPermissionChecker(userRole).hasRole(ROLES.VIEWER);

// Permission groups for common scenarios
export const POST_MANAGEMENT_PERMISSIONS = [
  PERMISSIONS.POST_CREATE,
  PERMISSIONS.POST_UPDATE,
  PERMISSIONS.POST_DELETE,
  PERMISSIONS.POST_PUBLISH,
] as const;

export const ORG_MANAGEMENT_PERMISSIONS = [
  PERMISSIONS.ORG_MANAGE,
  PERMISSIONS.ORG_MEMBERS,
  PERMISSIONS.ORG_SETTINGS,
] as const;

export const USER_MANAGEMENT_PERMISSIONS = [
  PERMISSIONS.USER_MANAGE,
  PERMISSIONS.USER_PROFILE,
] as const; 