/**
 * Nudge Governor - Handles frequency control and delivery state.
 * 双层频控：服务端 API + 客户端 localStorage 降级。
 */

import { storageAdapter } from "./storage-adapter";

interface NudgeEvent {
  userId: string;
  type: string;
  timestamp: number;
}

const GLOBAL_COOLING_MS = 15 * 60 * 1000; // 15 minutes
const TYPE_COOLING_MS = 60 * 60 * 1000; // 1 hour for same type

/** 服务端内存频控（用于 API route 调用时的服务端决策） */
const serverFrequencyStore = new Map<string, NudgeEvent[]>();

export const nudgeGovernor = {
  /**
   * Records a successful nudge delivery
   */
  recordDelivery: (userId: string, type: string): void => {
    // 客户端存储
    const history = storageAdapter.getItem<NudgeEvent[]>("nudge_history", []);
    const newEvent: NudgeEvent = {
      userId,
      type,
      timestamp: Date.now(),
    };
    
    // Keep only last 50 events per user to avoid bloat
    const updatedHistory = [newEvent, ...history]
      .filter(e => e.userId === userId)
      .slice(0, 50);
      
    storageAdapter.setItem("nudge_history", updatedHistory);

    // 服务端存储
    const serverHistory = serverFrequencyStore.get(userId) ?? [];
    serverFrequencyStore.set(userId, [newEvent, ...serverHistory].slice(0, 50));
  },

  /**
   * Checks if a nudge is allowed for a user (supports both client and server)
   */
  isAllowed: (userId: string, type: string): { allowed: boolean; reason?: string } => {
    // 优先使用服务端状态
    const serverHistory = serverFrequencyStore.get(userId);
    const history = serverHistory ?? storageAdapter.getItem<NudgeEvent[]>("nudge_history", []);
    const userHistory = history.filter(e => e.userId === userId);

    if (userHistory.length === 0) return { allowed: true };

    const now = Date.now();
    const lastGlobalEvent = userHistory[0];
    
    // 1. Global cooling check
    if (now - lastGlobalEvent.timestamp < GLOBAL_COOLING_MS) {
      return { 
        allowed: false, 
        reason: `Global cooling period active. Next available in ${Math.ceil((GLOBAL_COOLING_MS - (now - lastGlobalEvent.timestamp)) / 60000)}m.` 
      };
    }

    // 2. Per-type cooling check
    const lastTypeEvent = userHistory.find(e => e.type === type);
    if (lastTypeEvent && (now - lastTypeEvent.timestamp < TYPE_COOLING_MS)) {
      return { 
        allowed: false, 
        reason: `Type-specific cooling for "${type}" active.` 
      };
    }

    return { allowed: true };
  },

  /**
   * Server-side frequency check via API (async)
   */
  isAllowedAsync: async (userId: string): Promise<{ allowed: boolean; reason?: string; todayCount?: number }> => {
    try {
      const res = await fetch(`/api/nudge/frequency?userId=${userId}`);
      const data = await res.json();
      return data;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[Governor] Server check failed, using client fallback:", errMsg);
      // 降级到客户端检查
      return nudgeGovernor.isAllowed(userId, "standard_nudge");
    }
  },

  /**
   * Clears nudge history for a user (useful for testing)
   */
  clearHistory: (userId: string): void => {
    const history = storageAdapter.getItem<NudgeEvent[]>("nudge_history", []);
    const filtered = history.filter(e => e.userId !== userId);
    storageAdapter.setItem("nudge_history", filtered);
    serverFrequencyStore.delete(userId);
  }
};
