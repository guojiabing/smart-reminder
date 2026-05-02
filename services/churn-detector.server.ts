import { MOCK_USERS } from "@/lib/mock-data";

/** 流失预警阈值（天） */
const CHURN_THRESHOLD_DAYS = 4;

export interface ChurnAlert {
  userId: string;
  userName: string;
  daysInactive: number;
  lastActiveAt: string;
  parentNotified: boolean;
  notifiedAt?: string;
}

const parentNotifications = new Map<string, { notifiedAt: string }>();

export function detectChurnUsers(): ChurnAlert[] {
  const now = Date.now();

  return MOCK_USERS.filter((u) => {
    const lastActive = new Date(u.lastActiveAt);
    const daysInactive = Math.floor((now - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    return daysInactive >= CHURN_THRESHOLD_DAYS;
  }).map((u) => {
    const lastActive = new Date(u.lastActiveAt);
    const daysInactive = Math.floor((now - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    const notification = parentNotifications.get(u.id);

    return {
      userId: u.id,
      userName: u.name,
      daysInactive,
      lastActiveAt: u.lastActiveAt,
      parentNotified: !!notification,
      notifiedAt: notification?.notifiedAt,
    };
  });
}

export function markParentNotified(userId: string): void {
  parentNotifications.set(userId, { notifiedAt: new Date().toISOString() });
}
