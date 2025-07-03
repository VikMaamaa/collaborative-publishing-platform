"use client";
import { useAuthInitialization } from "@/lib/hooks";
import { useAppSelector } from "@/store/hooks";
import { apiClient } from "@/lib/api";
import { useEffect } from "react";

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAppSelector(state => state.auth.hasHydrated);
  const accessToken = useAppSelector(state => state.auth.accessToken);
  
  // Sync token to API client after hydration
  useEffect(() => {
    if (hasHydrated && accessToken) {
      apiClient.setToken(accessToken);
    }
  }, [hasHydrated, accessToken]);

  useAuthInitialization();
  return <>{children}</>;
} 