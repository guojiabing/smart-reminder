"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Send, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ChurnAlert {
  userId: string;
  userName: string;
  daysInactive: number;
  lastActiveAt: string;
  parentNotified: boolean;
  notifiedAt?: string;
}

interface ChurnAlertPanelProps {
  alerts: ChurnAlert[];
  onNotifyParent: (userId: string) => Promise<void>;
  onRefresh: () => void;
}

export function ChurnAlertPanel({ alerts, onNotifyParent, onRefresh }: ChurnAlertPanelProps) {
  const [sending, setSending] = useState<string | null>(null);

  const handleNotify = async (userId: string) => {
    setSending(userId);
    await onNotifyParent(userId);
    setSending(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">高危流失预警</h3>
          {alerts.length > 0 && (
            <Badge variant="destructive">{alerts.length}</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} className="gap-1">
          <RefreshCw className="h-3 w-3" />
          刷新
        </Button>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center dark:border-zinc-800">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
          <p className="text-sm text-zinc-500">暂无高危流失学生</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.userId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 p-4 dark:border-red-900/30 dark:bg-red-900/10"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {alert.userName}
                  </span>
                  <Badge variant="destructive">{alert.daysInactive} 天未活跃</Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-3 w-3" />
                  最后活跃: {new Date(alert.lastActiveAt).toLocaleDateString("zh-CN")}
                </div>
              </div>

              {alert.parentNotified ? (
                <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  已通知
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleNotify(alert.userId)}
                  disabled={sending === alert.userId}
                  className="gap-1"
                >
                  {sending === alert.userId ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  通知家长
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
