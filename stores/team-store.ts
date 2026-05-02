import { create } from "zustand";
import { produce } from "immer";
import { storageAdapter } from "@/lib/storage-adapter";

export interface TeamNotification {
  id: string;
  senderName: string;
  recipientId: string;
  type: "online" | "nudge";
  message?: string;
  timestamp: number;
  isRead: boolean;
}

interface TeamState {
  notifications: TeamNotification[];
}

interface TeamActions {
  sendSignal: (signal: Omit<TeamNotification, "id" | "timestamp" | "isRead">) => void;
  dismissNotification: (id: string) => void;
  markAllAsRead: (recipientId: string) => void;
  syncFromStorage: () => void;
}

// Initial state from storage
const getInitialNotifications = () => storageAdapter.getItem<TeamNotification[]>("team_notifications", []);

export const useTeamStore = create<TeamState & TeamActions>((set, get) => ({
  notifications: getInitialNotifications(),

  sendSignal: (signal) => {
    set(
      produce((state: TeamState) => {
        state.notifications.push({
          id: Math.random().toString(36).substring(7),
          ...signal,
          timestamp: Date.now(),
          isRead: false,
        });
      })
    );
    storageAdapter.setItem("team_notifications", get().notifications);
  },

  dismissNotification: (id: string) => {
    set(
      produce((state: TeamState) => {
        state.notifications = state.notifications.filter((n) => n.id !== id);
      })
    );
    storageAdapter.setItem("team_notifications", get().notifications);
  },

  markAllAsRead: (recipientId: string) => {
    set(
      produce((state: TeamState) => {
        state.notifications.forEach((n) => {
          if (n.recipientId === recipientId) {
            n.isRead = true;
          }
        });
      })
    );
    storageAdapter.setItem("team_notifications", get().notifications);
  },

  syncFromStorage: () => {
    set({ notifications: storageAdapter.getItem<TeamNotification[]>("team_notifications", []) });
  },
}));
