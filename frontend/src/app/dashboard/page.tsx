'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks';
import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import UserInvitations from '@/components/auth/UserInvitations';
import DashboardLayout, { 
  DashboardGrid, 
  DashboardCard, 
  DashboardStats, 
  DashboardStatCard,
  DashboardSection 
} from '@/components/layout/DashboardLayout';
import SEOHead, { SEOConfigs } from '@/components/seo/SEOHead';
import { usePerformanceMonitor } from '@/lib/performance';
import { LazyComponent } from '@/components/lazy/LazyComponents';
import { useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  console.log('DashboardPage rendered');
  const { user, logout } = useAuth();
  const router = useRouter();
  const { trackComponentRender, mark, measure } = usePerformanceMonitor();

  useEffect(() => {
    // Track component render performance
    const startTime = performance.now();
    mark('dashboard-render-start');
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      trackComponentRender('DashboardPage', renderTime);
      measure('dashboard-render', 'dashboard-render-start');
    };
  }, [trackComponentRender, mark, measure]);

  const handleNavigation = (path: string) => {
    const startTime = performance.now();
    router.push(path);
    const endTime = performance.now();
    const navigationTime = endTime - startTime;
    trackComponentRender(`Navigation-${path}`, navigationTime);
  };

  return (
    <ProtectedRoute>
      <>
        <SEOHead {...SEOConfigs.dashboard} />
        <DashboardLayout>
          <DashboardSection 
            title="Welcome to your Dashboard"
            subtitle="Manage your content, organizations, and settings"
          >
            {/* Stats Overview */}
            <DashboardStats className="mb-8">
              <DashboardStatCard
                title="Total Posts"
                value="12"
                change="+2 this week"
                changeType="positive"
                icon={
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                }
              />
              <DashboardStatCard
                title="Organizations"
                value="3"
                change="+1 this month"
                changeType="positive"
                icon={
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
              <DashboardStatCard
                title="Pending Invitations"
                value="2"
                change=""
                changeType="neutral"
                icon={
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <DashboardStatCard
                title="Published Content"
                value="8"
                change="+1 this week"
                changeType="positive"
                icon={
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              />
            </DashboardStats>

            {/* Main Content Grid */}
            <DashboardGrid cols={2} gap="lg">
              {/* User Information Card */}
              <DashboardCard 
                title="User Information"
                subtitle="Your account details"
              >
                {user && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Username:</span>
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{user.firstName} {user.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member since:</span>
                      <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </DashboardCard>

              {/* User Invitations Card */}
              <DashboardCard 
                title="Pending Invitations"
                subtitle="Organizations you've been invited to"
              >
                <LazyComponent>
                  <UserInvitations />
                </LazyComponent>
              </DashboardCard>
            </DashboardGrid>

            {/* Quick Actions */}
            <DashboardSection 
              title="Quick Actions"
              subtitle="Common tasks and navigation"
              className="mt-8"
            >
              <div className="flex flex-wrap gap-4">
                <Button
                  variant="primary"
                  onClick={() => handleNavigation('/posts')}
                >
                  View Posts
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleNavigation('/organizations')}
                >
                  Organizations
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNavigation('/profile')}
                >
                  Account Settings
                </Button>
                <Button
                  variant="outline"
                  onClick={logout}
                >
                  Sign Out
                </Button>
              </div>
            </DashboardSection>
          </DashboardSection>
        </DashboardLayout>
      </>
    </ProtectedRoute>
  );
} 