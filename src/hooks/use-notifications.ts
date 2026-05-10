import { useState, useCallback } from "react";

export interface LocalNotification {
  id: number;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications(_enabled = true) {
  const [notifications] = useState<LocalNotification[]>([]);
  const [unreadCount] = useState(0);

  const markRead = useCallback(async (_id: number) => {}, []);
  const markAllRead = useCallback(async () => {}, []);

  return { notifications, unreadCount, markRead, markAllRead };
}
