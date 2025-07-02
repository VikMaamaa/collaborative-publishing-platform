'use client';

import React from 'react';
import { usePermissions } from '@/lib/hooks';
import { ROLES, PERMISSIONS } from '@/lib/store';

interface RoleGuardProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export default function RoleGuard({ 
  children, 
  roles = [], 
  permissions = [], 
  fallback = null,
  requireAll = false 
}: RoleGuardProps) {
  const { hasRole, hasPermission, userRole } = usePermissions();

  // If no roles or permissions specified, render children
  if (roles.length === 0 && permissions.length === 0) {
    return <>{children}</>;
  }

  // Check roles
  const hasRequiredRole = roles.length === 0 || 
    (requireAll 
      ? roles.every(role => hasRole(role))
      : roles.some(role => hasRole(role))
    );

  // Check permissions
  const hasRequiredPermission = permissions.length === 0 || 
    (requireAll 
      ? permissions.every(permission => hasPermission(permission))
      : permissions.some(permission => hasPermission(permission))
    );

  // User must have both required roles AND permissions
  const isAuthorized = hasRequiredRole && hasRequiredPermission;

  if (isAuthorized) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Convenience components for common role checks
export function OwnerOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard roles={[ROLES.OWNER]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function EditorOrHigher({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard roles={[ROLES.OWNER, ROLES.EDITOR]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function WriterOrHigher({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard roles={[ROLES.OWNER, ROLES.EDITOR, ROLES.WRITER]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function CanCreatePost({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard permissions={[PERMISSIONS.POST_CREATE]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function CanManageOrg({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard permissions={[PERMISSIONS.ORG_MANAGE]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function CanManageMembers({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard permissions={[PERMISSIONS.ORG_MEMBERS]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// Higher-order component for role-based rendering
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  roles: string[] = [],
  permissions: string[] = [],
  fallback?: React.ReactNode
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <RoleGuard roles={roles} permissions={permissions} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    );
  };
} 