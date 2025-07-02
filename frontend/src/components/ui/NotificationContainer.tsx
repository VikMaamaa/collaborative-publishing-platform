'use client';

import { useUI } from '@/lib/hooks';
import Notification from './Notification';

export default function NotificationContainer() {
  const { notifications } = useUI();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="transform transition-all duration-300 ease-in-out animate-slide-in-right"
        >
          <Notification
            id={notification.id}
            type={notification.type}
            message={notification.message}
            duration={notification.duration}
          />
        </div>
      ))}
    </div>
  );
} 