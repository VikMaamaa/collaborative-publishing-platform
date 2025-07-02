'use client';

import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { User, Organization } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
  user?: User;
  currentOrganization?: Organization;
  organizations?: Organization[];
  onOrganizationChange?: (organizationId: string) => void;
  onLogout?: () => void;
  showSidebar?: boolean;
}

export default function Layout({
  children,
  user,
  currentOrganization,
  organizations = [],
  onOrganizationChange,
  onLogout,
  showSidebar = true
}: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsMobileMenuOpen(false);
  };

  const handleOrganizationChange = (organizationId: string) => {
    if (onOrganizationChange) {
      onOrganizationChange(organizationId);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        user={user}
        currentOrganization={currentOrganization}
        organizations={organizations}
        onOrganizationChange={handleOrganizationChange}
        onLogout={handleLogout}
      />

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
              <Sidebar
                organization={currentOrganization}
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
              <div className="fixed inset-0 z-40 md:hidden">
                <div
                  className="fixed inset-0 bg-gray-600 bg-opacity-75"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
                  <Sidebar
                    organization={currentOrganization}
                    isCollapsed={false}
                    onToggle={() => setIsMobileMenuOpen(false)}
                  />
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden fixed bottom-4 right-4 z-50">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          showSidebar 
            ? sidebarCollapsed 
              ? 'md:ml-16' 
              : 'md:ml-64'
            : ''
        }`}>
          <div className="min-h-screen flex flex-col">
            {/* Page Content */}
            <div className="flex-1">
              {children}
            </div>

            {/* Footer */}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
} 