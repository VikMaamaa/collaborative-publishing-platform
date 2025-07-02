'use client';

import { usePermissions, useAuth } from '@/lib/hooks';
import { ROLES, PERMISSIONS } from '@/lib/store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  children?: NavItem[];
}

export default function PermissionNav() {
  const { hasRole, hasPermission, userRole } = usePermissions();
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navigationItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      ),
    },
    {
      label: 'Posts',
      href: '/posts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      permissions: [PERMISSIONS.POST_READ],
      children: [
        {
          label: 'All Posts',
          href: '/posts',
          permissions: [PERMISSIONS.POST_READ],
        },
        {
          label: 'Create Post',
          href: '/posts/create',
          permissions: [PERMISSIONS.POST_CREATE],
        },
        {
          label: 'Drafts',
          href: '/posts/drafts',
          permissions: [PERMISSIONS.POST_READ],
        },
      ],
    },
    {
      label: 'Organizations',
      href: '/organizations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      children: [
        {
          label: 'Overview',
          href: '/organizations',
        },
        {
          label: 'Members',
          href: '/organizations?tab=members',
          permissions: [PERMISSIONS.ORG_MEMBERS],
        },
        {
          label: 'Settings',
          href: '/organizations?tab=settings',
          permissions: [PERMISSIONS.ORG_SETTINGS],
        },
      ],
    },
    {
      label: 'Users',
      href: '/users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      permissions: [PERMISSIONS.USER_MANAGE],
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: [ROLES.OWNER, ROLES.EDITOR],
    },
  ];

  const canAccessItem = (item: NavItem): boolean => {
    // Check roles
    if (item.roles && item.roles.length > 0) {
      if (!item.roles.some(role => hasRole(role))) {
        return false;
      }
    }

    // Check permissions
    if (item.permissions && item.permissions.length > 0) {
      if (!item.permissions.some(permission => hasPermission(permission))) {
        return false;
      }
    }

    return true;
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    if (!canAccessItem(item)) {
      return null;
    }

    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const baseClasses = isChild 
      ? 'block px-3 py-2 text-sm rounded-md transition-colors'
      : 'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors';
    
    const activeClasses = isActive 
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white';

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`${baseClasses} ${activeClasses}`}
      >
        {!isChild && item.icon && (
          <span className="mr-3 flex-shrink-0">{item.icon}</span>
        )}
        {item.label}
      </Link>
    );
  };

  const renderNavGroup = (item: NavItem) => {
    if (!canAccessItem(item)) {
      return null;
    }

    const accessibleChildren = item.children?.filter(canAccessItem) || [];
    
    if (accessibleChildren.length === 0) {
      // If no children are accessible, render as a simple link
      return renderNavItem(item);
    }

    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const baseClasses = 'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors';
    const activeClasses = isActive 
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white';

    return (
      <div key={item.href} className="space-y-1">
        <Link href={item.href} className={`${baseClasses} ${activeClasses}`}>
          {item.icon && <span className="mr-3 flex-shrink-0">{item.icon}</span>}
          {item.label}
        </Link>
        <div className="ml-6 space-y-1">
          {accessibleChildren.map(child => renderNavItem(child, true))}
        </div>
      </div>
    );
  };

  const accessibleItems = navigationItems.filter(canAccessItem);

  if (accessibleItems.length === 0) {
    return (
      <nav className="space-y-1">
        <div className="px-3 py-2 text-sm text-gray-500">
          No accessible navigation items
        </div>
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {accessibleItems.map(item => 
        item.children ? renderNavGroup(item) : renderNavItem(item)
      )}
    </nav>
  );
} 