'use client';

import { useState } from 'react';
import { Input, Button, SkeletonCard } from '@/components/ui';
import DashboardLayout, { 
  DashboardGrid, 
  DashboardCard, 
  DashboardSection 
} from '@/components/layout/DashboardLayout';

export default function TestPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <DashboardLayout>
      <DashboardSection 
        title="Test Page"
        subtitle="Testing input visibility and hydration"
      >
        <DashboardGrid>
          <DashboardCard>
            <div className="space-y-4">
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
            </div>

            <div className="space-y-2 mt-4">
              <p className="text-sm text-gray-600">Email: {email}</p>
              <p className="text-sm text-gray-600">Password: {password}</p>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-4"
              onClick={() => alert('Test successful!')}
            >
              Test Button
            </Button>
          </DashboardCard>
        </DashboardGrid>
      </DashboardSection>
    </DashboardLayout>
  );
} 