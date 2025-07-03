'use client';

import React, { createContext, useContext } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setActingAsOrganization, clearActingAsOrganization } from '@/store/organizationsSlice';

interface ActingOrgContextValue {
  actingAsOrganizationId: string | null;
  setActingAsOrganization: (id: string | null) => void;
}

const ActingOrgContext = createContext<ActingOrgContextValue | undefined>(undefined);

export function ActingOrgProvider({ children }: { children: React.ReactNode }) {
  const actingAsOrganizationId = useAppSelector(state => state.organizations.actingAsOrganizationId);
  const dispatch = useAppDispatch();
  const setActing = (id: string | null) => {
    if (id) {
      dispatch(setActingAsOrganization(id));
    } else {
      dispatch(clearActingAsOrganization());
    }
  };
  return (
    <ActingOrgContext.Provider value={{ actingAsOrganizationId, setActingAsOrganization: setActing }}>
      {children}
    </ActingOrgContext.Provider>
  );
}

export function useActingOrg() {
  const context = useContext(ActingOrgContext);
  if (!context) {
    throw new Error('useActingOrg must be used within an ActingOrgProvider');
  }
  return context;
}

export function ActingOrgBanner() {
  const actingAsOrganizationId = useAppSelector(state => state.organizations.actingAsOrganizationId);
  const organizations = useAppSelector(state => state.organizations.organizations);
  if (!actingAsOrganizationId) return null;
  const org = organizations.find((o: any) => o.id === actingAsOrganizationId);
  if (!org) return null;
  return (
    <div className="bg-blue-100 text-blue-800 px-4 py-2 text-sm">
      Acting as organization: <strong>{org.name}</strong>
    </div>
  );
} 