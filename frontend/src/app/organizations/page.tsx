'use client';

import { useOrganizations, useAuth, useUI } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge, SkeletonCard, SkeletonGrid } from '@/components/ui';
import OrganizationMembers from '@/components/organizations/OrganizationMembers';
import { useState, useEffect } from 'react';
import { ROLES } from '@/lib/store';
import DashboardLayout, { 
  DashboardGrid, 
  DashboardCard, 
  DashboardSection 
} from '@/components/layout/DashboardLayout';
import SEOHead, { SEOConfigs } from '@/components/seo/SEOHead';
import { usePerformanceMonitor } from '@/lib/performance';
import { LazyComponent } from '@/components/lazy/LazyComponents';

export default function OrganizationsPage() {
  const { organizations, activeOrganization, setActiveOrganization } = useOrganizations();
  const { user } = useAuth();
  const { addNotification, openModal } = useUI();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'members' | 'settings'>('overview');
  const { trackComponentRender, mark, measure } = usePerformanceMonitor();

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

  if (!user) {
    return (
      <>
        <SEOHead {...SEOConfigs.dashboard} />
        <DashboardLayout>
          <SkeletonGrid cols={3} rows={2} />
        </DashboardLayout>
      </>
    );
  }

  const handleCreateOrganization = () => {
    const startTime = performance.now();
    openModal('createOrganization');
    const endTime = performance.now();
    trackComponentRender('CreateOrganizationModal', endTime - startTime);
  };

  const handleSwitchOrganization = (organization: any) => {
    const startTime = performance.now();
    setActiveOrganization(organization);
    addNotification({
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
    );
  }

  return (
    <>
      <SEOHead {...SEOConfigs.dashboard} />
      <DashboardLayout>
        <DashboardSection 
          title="Organizations"
          subtitle="Manage your organizations and team members"
          actions={
            <Button
              variant="primary"
              onClick={handleCreateOrganization}
            >
              Create Organization
            </Button>
          }
        >

          {/* Organization Selector */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Organization</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer transition-all ${
                    activeOrganization?.id === org.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:shadow-md'
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
  );
}

// Organization Overview Component
function OrganizationOverview({ organization }: { organization: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {organization.name}
        </h2>
        {organization.description && (
          <p className="text-gray-600">{organization.description}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Members</p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Posts</p>
                <p className="text-2xl font-semibold text-gray-900">24</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Date(organization.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Post
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Invite Member
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </Button>
        </div>
      </div>
    </div>
  );
}

// Organization Settings Component
function OrganizationSettings({ organization }: { organization: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: organization.name,
    description: organization.description || '',
  });
  const { userRole, deleteOrganization } = useOrganizations();
  const { addNotification, openConfirmModal } = useUI();
  const router = useRouter();

  const handleSave = async () => {
    // TODO: Implement organization update
    setIsEditing(false);
  };

  const handleDelete = () => {
    openConfirmModal({
      title: 'Delete Organization',
      message: `Are you sure you want to delete "${organization.name}"? This action cannot be undone and will remove all data for this organization.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteOrganization(organization.id);
          addNotification({
            type: 'success',
            message: `Organization "${organization.name}" deleted successfully`,
            duration: 4000,
          });
          router.push('/dashboard');
        } catch (error) {
          addNotification({
            type: 'error',
            message: 'Failed to delete organization. Please try again.',
            duration: 4000,
          });
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
        <Button
          variant={isEditing ? "primary" : "outline"}
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          {isEditing ? 'Save Changes' : 'Edit Settings'}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{organization.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{organization.description || 'No description'}</p>
                )}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created
                </label>
                <p className="text-gray-900">
                  {new Date(organization.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <p className="text-gray-900">
                  {new Date(organization.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Role
                </label>
                                      <Badge variant="primary">{organization.role || 'member'}</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
      {userRole === 'owner' && (
        <div className="pt-6">
          <Button
            variant="danger"
            onClick={handleDelete}
            className="w-full"
          >
            Delete Organization
          </Button>
        </div>
      )}
    </div>
  );
} 