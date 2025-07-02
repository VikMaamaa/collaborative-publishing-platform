'use client';

import { useRealtime } from '@/lib/realtime';
import { useAuth } from '@/lib/hooks';

export default function RealtimeProvider() {
  const { user } = useAuth();
  const { isConnected } = useRealtime();

  // This component doesn't render anything visible
  // It just manages the realtime connection
  return null;
} 