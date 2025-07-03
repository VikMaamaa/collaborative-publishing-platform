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
import { useOrganizationMembers } from '@/lib/api-hooks';

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
                        <Badge variant={getRoleBadgeColor((org as any).role || 'viewer')}>
                          {(org as any).role || 'viewer'}
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
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Organization Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900">Total Members</h4>
          <p className="text-2xl font-bold text-blue-600">12</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900">Active Posts</h4>
          <p className="text-2xl font-bold text-green-600">8</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900">Published Content</h4>
          <p className="text-2xl font-bold text-purple-600">5</p>
        </div>
      </div>
    </div>
  );
}

function OrganizationSettings({ organization }: { organization: any }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Organization Settings</h3>
      <p className="text-gray-600">Settings functionality will be implemented here.</p>
    </div>
  );
} 