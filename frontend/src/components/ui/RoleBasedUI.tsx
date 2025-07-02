'use client';

import React from 'react';
import { usePermissions } from '@/lib/hooks';
import { ROLES, PERMISSIONS } from '@/lib/store';
import { Button, Badge } from './index';

interface RoleBasedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  roles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function RoleBasedButton({
  children,
  variant = 'primary',
  size = 'md',
  roles = [],
  permissions = [],
  fallback,
  onClick,
  disabled = false,
  className = '',
}: RoleBasedButtonProps) {
  const { hasRole, hasPermission } = usePermissions();

  const canAccess = () => {
    // Check roles
    if (roles.length > 0 && !roles.some(role => hasRole(role))) {
      return false;
    }

    // Check permissions
    if (permissions.length > 0 && !permissions.some(permission => hasPermission(permission))) {
      return false;
    }

    return true;
  };

  if (!canAccess()) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </Button>
  );
}

interface RoleBasedBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  roles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
  className?: string;
}

export function RoleBasedBadge({
  children,
  variant = 'primary',
  size = 'md',
  roles = [],
  permissions = [],
  fallback,
  className = '',
}: RoleBasedBadgeProps) {
  const { hasRole, hasPermission } = usePermissions();

  const canAccess = () => {
    if (roles.length > 0 && !roles.some(role => hasRole(role))) {
      return false;
    }

    if (permissions.length > 0 && !permissions.some(permission => hasPermission(permission))) {
      return false;
    }

    return true;
  };

  if (!canAccess()) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <Badge variant={variant} size={size} className={className}>
      {children}
    </Badge>
  );
}

interface RoleBasedContentProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
  className?: string;
}

export function RoleBasedContent({
  children,
  roles = [],
  permissions = [],
  fallback,
  className = '',
}: RoleBasedContentProps) {
  const { hasRole, hasPermission } = usePermissions();

  const canAccess = () => {
    if (roles.length > 0 && !roles.some(role => hasRole(role))) {
      return false;
    }

    if (permissions.length > 0 && !permissions.some(permission => hasPermission(permission))) {
      return false;
    }

    return true;
  };

  if (!canAccess()) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return <div className={className}>{children}</div>;
}

// Convenience components for common role-based UI patterns
export function OwnerOnlyButton({ children, ...props }: Omit<RoleBasedButtonProps, 'roles'>) {
  return (
    <RoleBasedButton roles={[ROLES.OWNER]} {...props}>
      {children}
    </RoleBasedButton>
  );
}

export function EditorOrHigherButton({ children, ...props }: Omit<RoleBasedButtonProps, 'roles'>) {
  return (
    <RoleBasedButton roles={[ROLES.OWNER, ROLES.EDITOR]} {...props}>
      {children}
    </RoleBasedButton>
  );
}

export function WriterOrHigherButton({ children, ...props }: Omit<RoleBasedButtonProps, 'roles'>) {
  return (
    <RoleBasedButton roles={[ROLES.OWNER, ROLES.EDITOR, ROLES.WRITER]} {...props}>
      {children}
    </RoleBasedButton>
  );
}

export function CanCreatePostButton({ children, ...props }: Omit<RoleBasedButtonProps, 'permissions'>) {
  return (
    <RoleBasedButton permissions={[PERMISSIONS.POST_CREATE]} {...props}>
      {children}
    </RoleBasedButton>
  );
}

export function CanManageOrgButton({ children, ...props }: Omit<RoleBasedButtonProps, 'permissions'>) {
  return (
    <RoleBasedButton permissions={[PERMISSIONS.ORG_MANAGE]} {...props}>
      {children}
    </RoleBasedButton>
  );
}

export function CanManageMembersButton({ children, ...props }: Omit<RoleBasedButtonProps, 'permissions'>) {
  return (
    <RoleBasedButton permissions={[PERMISSIONS.ORG_MEMBERS]} {...props}>
      {children}
    </RoleBasedButton>
  );
}

// Role-based content components
export function OwnerOnlyContent({ children, ...props }: Omit<RoleBasedContentProps, 'roles'>) {
  return (
    <RoleBasedContent roles={[ROLES.OWNER]} {...props}>
      {children}
    </RoleBasedContent>
  );
}

export function EditorOrHigherContent({ children, ...props }: Omit<RoleBasedContentProps, 'roles'>) {
  return (
    <RoleBasedContent roles={[ROLES.OWNER, ROLES.EDITOR]} {...props}>
      {children}
    </RoleBasedContent>
  );
}

export function CanCreatePostContent({ children, ...props }: Omit<RoleBasedContentProps, 'permissions'>) {
  return (
    <RoleBasedContent permissions={[PERMISSIONS.POST_CREATE]} {...props}>
      {children}
    </RoleBasedContent>
  );
}

// Role-based badge components
export function RoleBadge({ role, className = '' }: { role: string; className?: string }) {
  const getVariant = (role: string) => {
    switch (role) {
      case ROLES.OWNER:
        return 'error';
      case ROLES.EDITOR:
        return 'primary';
      case ROLES.WRITER:
        return 'success';
      case ROLES.VIEWER:
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getVariant(role)} className={className}>
      {role}
    </Badge>
  );
}

export function PermissionBadge({ permission, className = '' }: { permission: string; className?: string }) {
  const getVariant = (permission: string) => {
    if (permission.includes('create')) return 'success';
    if (permission.includes('delete')) return 'error';
    if (permission.includes('manage')) return 'primary';
    if (permission.includes('read')) return 'info';
    return 'secondary';
  };

  return (
    <Badge variant={getVariant(permission)} className={className}>
      {permission.split(':')[1]}
    </Badge>
  );
} 