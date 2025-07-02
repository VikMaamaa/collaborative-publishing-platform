'use client';

import React, { createContext, useContext } from 'react';
import { useAppStore } from '@/lib/store';

interface ActingOrgContextValue {
  actingAsOrganizationId: string | null;
  setActingAsOrganization: (orgId: string | null) => void;
}

const ActingOrgContext = createContext<ActingOrgContextValue | undefined>(undefined);

export function ActingOrgProvider({ children }: { children: React.ReactNode }) {
  const actingAsOrganizationId = useAppStore(state => state.actingAsOrganizationId);
  const setActingAsOrganization = useAppStore(state => state.setActingAsOrganization);

  return (
    <ActingOrgContext.Provider value={{ actingAsOrganizationId, setActingAsOrganization }}>
      {children}
      <ActingOrgBanner />
    </ActingOrgContext.Provider>
  );
}

export function useActingOrg() {
  const ctx = useContext(ActingOrgContext);
  if (!ctx) throw new Error('useActingOrg must be used within ActingOrgProvider');
  return ctx;
}

function ActingOrgBanner() {
  const actingAsOrganizationId = useAppStore(state => state.actingAsOrganizationId);
  const organizations = useAppStore(state => state.organizations);
  if (!actingAsOrganizationId) return null;
  const org = organizations.find(o => o.id === actingAsOrganizationId);
  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-yellow-100 text-yellow-900 text-center py-2 shadow">
      <span className="font-semibold">Acting as organization:</span> {org?.name || actingAsOrganizationId}
      <span className="ml-4 text-xs">(Cross-organization permissions in effect)</span>
    </div>
  );
} 