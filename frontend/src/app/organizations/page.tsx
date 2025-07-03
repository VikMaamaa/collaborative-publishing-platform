'use client';

import { useAuth, useUI } from '@/lib/hooks';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadOrganizations, createOrganization, updateOrganization, deleteOrganization, setActiveOrganization } from '@/store/organizationsSlice';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge, SkeletonCard, SkeletonGrid } from '@/components/ui';
import OrganizationMembers from '@/components/organizations/OrganizationMembers';
import { useState, useEffect } from 'react';
import { ROLES } from '@/constants/roles';
import DashboardLayout, { 
  DashboardGrid, 
  DashboardCard, 
  DashboardSection 
} from '@/components/layout/DashboardLayout';
import SEOHead, { SEOConfigs } from '@/components/seo/SEOHead';
import { usePerformanceMonitor } from '@/lib/performance';
import { LazyComponent } from '@/components/lazy/LazyComponents';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useOrganizationMembers, usePosts } from '@/lib/api-hooks';
import { apiClient } from '@/lib/api';

export default function OrganizationsPage() {
  const { user } = useAuth();
  const { addNotification, modals, openModal, closeModal } = useUI();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'members' | 'settings'>('overview');
  const { trackComponentRender, mark, measure } = usePerformanceMonitor();
  const organizations = useAppSelector((state) => state.organizations.organizations);
  const activeOrganization = useAppSelector((state) => state.organizations.activeOrganization);
  const dispatch = useAppDispatch();
  // Fetch members for the active organization
  const { data: members, loading: membersLoading } = useOrganizationMembers(activeOrganization?.id);

  // Helper function to get user's role in an organization
  const getUserRoleInOrganization = (org: any) => {
    // Use the userRole field from the API response
    return org.userRole || 'viewer';
  };

  useEffect(() => {
    // Track component render performance
    const startTime = performance.now();
    mark('organizations-render-start');
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      trackComponentRender('OrganizationsPage', renderTime);
      measure('organizations-render', 'organizations-render-start');
    };
  }, [trackComponentRender, mark, measure]);

  // Load organizations when component mounts and user is authenticated
  useEffect(() => {
    if (user && organizations.length === 0) {
      dispatch(loadOrganizations());
    }
  }, [user, organizations.length, dispatch]);

  useEffect(() => {
    if (activeOrganization && members && Array.isArray(members)) {
      // Attach members array to activeOrganization in Redux
      dispatch({
        type: 'organizations/setActiveOrganization',
        payload: { ...activeOrganization, members },
      });
    }
  }, [activeOrganization?.id, members?.length]);

  if (!user) {
    return (
      <ProtectedRoute>
        <>
          <SEOHead {...SEOConfigs.dashboard} />
          <DashboardLayout>
            <SkeletonGrid cols={3} rows={2} />
          </DashboardLayout>
        </>
      </ProtectedRoute>
    );
  }

  const handleCreateOrganization = () => {
    const startTime = performance.now();
    router.push('/organizations/create');
    const endTime = performance.now();
    trackComponentRender('CreateOrganizationPage', endTime - startTime);
  };

  const handleSwitchOrganization = (organization: any) => {
    const startTime = performance.now();
    dispatch(setActiveOrganization(organization));
    addNotification({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      type: 'success',
      message: `Switched to ${organization.name}`,
      duration: 3000,
    });
    const endTime = performance.now();
    trackComponentRender('SwitchOrganization', endTime - startTime);
  };

  const getRoleBadgeColor = (role: string) => {
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

  if (organizations.length === 0) {
    return (
      <ProtectedRoute>
        <>
          <SEOHead {...SEOConfigs.dashboard} />
          <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                  <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Organizations
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Get started by creating your first organization or joining an existing one.
                </p>
                <div className="space-x-4">
                  <Button
                    variant="primary"
                    onClick={handleCreateOrganization}
                  >
                    Create Organization
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <>
        <SEOHead {...SEOConfigs.dashboard} />
        <DashboardLayout>
          <DashboardSection 
            title="Organizations"
            subtitle="Manage your organizations and members"
          >
            {/* Organization List */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Your Organizations</h2>
                <Button
                  variant="primary"
                  onClick={handleCreateOrganization}
                >
                  Create Organization
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations.map((org: any) => (
                  <div
                    key={org.id}
                    className={`bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                      activeOrganization?.id === org.id ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    onClick={() => handleSwitchOrganization(org)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{org.name}</h3>
                        {activeOrganization?.id === org.id && (
                          <Badge variant="primary">Active</Badge>
                        )}
                      </div>
                      {org.description && (
                        <p className="text-sm text-gray-600 mb-3">{org.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
                        <Badge variant={getRoleBadgeColor(getUserRoleInOrganization(org))}>
                          {getUserRoleInOrganization(org)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Organization Content */}
            {activeOrganization && (
              <div className="bg-white rounded-lg shadow">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8 px-6">
                    {[
                      { id: 'overview', label: 'Overview', icon: '📊' },
                      { id: 'members', label: 'Members', icon: '👥' },
                      { id: 'settings', label: 'Settings', icon: '⚙️' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id as any)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          selectedTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {selectedTab === 'overview' && (
                    <OrganizationOverview organization={activeOrganization} />
                  )}
                  {selectedTab === 'members' && (
                    <LazyComponent>
                      <OrganizationMembers />
                    </LazyComponent>
                  )}
                  {selectedTab === 'settings' && (
                    <OrganizationSettings organization={activeOrganization} />
                  )}
                </div>
              </div>
            )}
          </DashboardSection>
        </DashboardLayout>
      </>
    </ProtectedRoute>
  );
}

// Placeholder components for the tabs
function OrganizationOverview({ organization }: { organization: any }) {
  // Fetch posts for this organization
  const { data: draftPosts } = usePosts({ organizationId: organization.id, status: 'draft' });
  const { data: publishedPosts } = usePosts({ organizationId: organization.id, status: 'published' });
  const totalMembers = organization.members ? organization.members.length : 0;
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Organization Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900">Total Members</h4>
          <p className="text-2xl font-bold text-blue-600">{totalMembers}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900">Active Posts</h4>
          <p className="text-2xl font-bold text-green-600">{draftPosts?.data?.length ?? 0}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900">Published Content</h4>
          <p className="text-2xl font-bold text-purple-600">{publishedPosts?.data?.length ?? 0}</p>
        </div>
      </div>
    </div>
  );
}

function OrganizationSettings({ organization }: { organization: any }) {
  const dispatch = useAppDispatch();
  const { addNotification } = useUI();
  const [name, setName] = useState(organization.name || '');
  const [description, setDescription] = useState(organization.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await dispatch(updateOrganization({ id: organization.id, data: { name, description } }));
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Organization updated successfully!',
        duration: 4000,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update organization.');
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: err.message || 'Failed to update organization.',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteOrganization(organization.id));
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Organization deleted successfully!',
        duration: 4000,
      });
    } catch (err: any) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: err.message || 'Failed to delete organization.',
        duration: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (!window.confirm('Are you sure you want to restore this organization?')) return;
    setIsRestoring(true);
    try {
      // TODO: Implement restore logic (API endpoint needed)
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Organization restored successfully! (placeholder)',
        duration: 4000,
      });
    } catch (err: any) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: err.message || 'Failed to restore organization.',
        duration: 4000,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h3 className="text-lg font-medium text-gray-900">Organization Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <div className="pt-6 border-t mt-6 flex gap-4">
        {organization.isActive ? (
          <button
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Organization'}
          </button>
        ) : (
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            onClick={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? 'Restoring...' : 'Restore Organization'}
          </button>
        )}
      </div>
    </div>
  );
} 