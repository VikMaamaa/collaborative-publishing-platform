import { useState, useEffect } from 'react';
import { useAppStore } from './store';

export interface RealtimeEvent {
  type: 'notification' | 'post_update' | 'member_join' | 'invitation' | 'system';
  data: any;
  timestamp: string;
  id: string;
}

class RealtimeService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private listeners: Map<string, (event: RealtimeEvent) => void> = new Map();

  connect(userId: string, token: string) {
    if (this.isConnected) {
      this.disconnect();
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/realtime/events?userId=${userId}&token=${encodeURIComponent(token)}`;
      this.eventSource = new EventSource(url);

      this.setupEventListeners();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('Realtime connection established');
    } catch (error) {
      console.error('Failed to establish realtime connection:', error);
      this.scheduleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.eventSource) return;

    this.eventSource.onopen = () => {
      console.log('Realtime connection opened');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
        this.handleEvent(realtimeEvent);
      } catch (error) {
        console.error('Failed to parse realtime event:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('Realtime connection error:', error);
      this.isConnected = false;
      this.scheduleReconnect();
    };

    this.eventSource.addEventListener('notification', (event) => {
      try {
        const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
        this.handleEvent(realtimeEvent);
      } catch (error) {
        console.error('Failed to parse notification event:', error);
      }
    });

    this.eventSource.addEventListener('post_update', (event) => {
      try {
        const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
        this.handleEvent(realtimeEvent);
      } catch (error) {
        console.error('Failed to parse post update event:', error);
      }
    });

    this.eventSource.addEventListener('member_join', (event) => {
      try {
        const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
        this.handleEvent(realtimeEvent);
      } catch (error) {
        console.error('Failed to parse member join event:', error);
      }
    });
  }

  private handleEvent(event: RealtimeEvent) {
    // Update store based on event type
    const store = useAppStore.getState();

    switch (event.type) {
      case 'notification':
        store.addNotification({
          type: 'info',
          message: event.data.message,
          duration: 5000,
        });
        break;

      case 'post_update':
        // Refresh posts if user is viewing posts
        if (store.posts.length > 0) {
          store.loadPosts();
        }
        store.addNotification({
          type: 'info',
          message: `Post "${event.data.title}" has been updated`,
          duration: 4000,
        });
        break;

      case 'member_join':
        // Refresh organization members
        if (store.activeOrganization) {
          store.loadOrganizationMembers(store.activeOrganization.id);
        }
        store.addNotification({
          type: 'success',
          message: `${event.data.memberName} has joined the organization`,
          duration: 4000,
        });
        break;

      case 'invitation':
        // Refresh invitations
        if (store.activeOrganization) {
          store.loadOrganizationInvitations(store.activeOrganization.id);
        }
        store.loadUserInvitations();
        store.addNotification({
          type: 'info',
          message: event.data.message,
          duration: 4000,
        });
        break;

      default:
        console.log('Unknown realtime event type:', event.type);
    }

    // Notify custom listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in realtime event listener:', error);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      const store = useAppStore.getState();
      if (store.user) {
        this.connect(store.user.id, store.accessToken || '');
      }
    }, delay);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    console.log('Realtime connection closed');
  }

  addEventListener(eventType: string, listener: (event: RealtimeEvent) => void) {
    this.listeners.set(eventType, listener);
  }

  removeEventListener(eventType: string) {
    this.listeners.delete(eventType);
  }

  isConnectedStatus() {
    return this.isConnected;
  }
}

export const realtimeService = new RealtimeService();

// React hook for realtime events
export const useRealtime = () => {
  const { user, accessToken } = useAppStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user && accessToken) {
      realtimeService.connect(user.id, accessToken);
      setIsConnected(true);

      return () => {
        realtimeService.disconnect();
        setIsConnected(false);
      };
    }
  }, [user, accessToken]);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(realtimeService.isConnectedStatus());
    };

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    addEventListener: realtimeService.addEventListener.bind(realtimeService),
    removeEventListener: realtimeService.removeEventListener.bind(realtimeService),
  };
}; 