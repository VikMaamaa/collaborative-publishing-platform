'use client';

import { useState } from 'react';
import { Input, Button, SkeletonCard } from '@/components/ui';
import { useAuth } from '@/lib/hooks';
import { apiClient } from '@/lib/api';
import DashboardLayout, { 
  DashboardGrid, 
  DashboardCard, 
  DashboardSection 
} from '@/components/layout/DashboardLayout';

export default function TestPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, isAuthenticated, isLoading, hasHydrated, login, logout } = useAuth();
  const [testResult, setTestResult] = useState('');

  const testAuth = async () => {
    try {
      setTestResult('Testing authentication...');
      const userData = await apiClient.getCurrentUser();
      setTestResult(`Success! User: ${userData.username} (${userData.email})`);
    } catch (error: any) {
      setTestResult(`Error: ${error.message}`);
    }
  };

  const testLogin = async () => {
    try {
      setTestResult('Testing login...');
      await login(email, password);
      setTestResult('Login successful!');
    } catch (error: any) {
      setTestResult(`Login error: ${error.message}`);
    }
  };

  return (
    <DashboardLayout>
      <DashboardSection 
        title="Auth Test Page"
        subtitle="Testing authentication and API calls"
      >
        <DashboardGrid>
          <DashboardCard>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Auth State</h3>
              <div className="space-y-2 text-sm">
                <p>isAuthenticated: {isAuthenticated ? 'true' : 'false'}</p>
                <p>isLoading: {isLoading ? 'true' : 'false'}</p>
                <p>hasHydrated: {hasHydrated ? 'true' : 'false'}</p>
                <p>User: {user ? `${user.username || 'N/A'} (${user.email || 'N/A'})` : 'null'}</p>
                <p>Token: {localStorage.getItem('access_token') ? 'Present' : 'Missing'}</p>
              </div>

              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              <div className="space-y-2">
                <Button
                  variant="primary"
                  onClick={testLogin}
                  disabled={!email || !password}
                >
                  Test Login
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={testAuth}
                  disabled={!isAuthenticated}
                >
                  Test Get Current User
                </Button>
                
                <Button
                  variant="outline"
                  onClick={logout}
                >
                  Logout
                </Button>
              </div>

              {testResult && (
                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <p className="text-sm">{testResult}</p>
                </div>
              )}
            </div>
          </DashboardCard>
        </DashboardGrid>
      </DashboardSection>
    </DashboardLayout>
  );
} 