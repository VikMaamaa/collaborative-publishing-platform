import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui';

// Lazy load heavy components
export const LazyDashboardLayout = lazy(() => import('@/components/layout/DashboardLayout'));
export const LazySearchBar = lazy(() => import('@/components/search/SearchBar'));
export const LazyFilterSort = lazy(() => import('@/components/ui/FilterSort'));
export const LazyExportImport = lazy(() => import('@/components/ui/ExportImport'));
export const LazyPagination = lazy(() => import('@/components/ui/Pagination'));
// Modal components are named exports, so we need to handle them differently
const ModalModule = lazy(() => import('@/components/ui/Modal'));
export const LazyNotificationContainer = lazy(() => import('@/components/ui/NotificationContainer'));

// Lazy load page components
export const LazyOrganizationsPage = lazy(() => import('@/app/organizations/page'));
export const LazyProfilePage = lazy(() => import('@/app/profile/page'));
export const LazySearchPage = lazy(() => import('@/app/search/page'));
export const LazyTestPage = lazy(() => import('@/app/test/page'));

// Lazy load modal components
export const LazyCreateOrganizationModal = lazy(() => import('@/components/organizations/CreateOrganizationModal'));
export const LazyInviteMemberModal = lazy(() => import('@/components/organizations/InviteMemberModal'));

// Loading fallback components
const PageLoadingFallback = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-8 w-64 mb-4" />
      <Skeleton className="h-4 w-96 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  </div>
);

const ComponentLoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
  </div>
);

const ModalLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy component wrappers with proper fallbacks
export const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoadingFallback />}>
    {children}
  </Suspense>
);

export const LazyComponent = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<ComponentLoadingFallback />}>
    {children}
  </Suspense>
);

export const LazyModalComponent = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    {children}
  </Suspense>
); 