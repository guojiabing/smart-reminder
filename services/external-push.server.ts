import { sanitizePii } from "@/services/pii-sanitizer";
import type { User, Task } from "@/lib/types";

export interface PushResult {
  success: boolean;
  channel: "wechat" | "enterprise_wechat";
  userId: string;
  message: string;
  sentAt: string;
}

const pushLog: PushResult[] = [];

export async function sendParentWeeklyReport(
  user: User,
  tasks: Task[]
): Promise<PushResult> {
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const rawMessage = `【学情周报】家长您好，${user.name}同学本周学习任务完成率为${completionRate}%（${completedCount}/${totalCount}），已连续${user.streakDays}天活跃。建议关注并鼓励孩子保持学习节奏。`;

  const { sanitizedText } = sanitizePii(rawMessage, user.name);

  await new Promise((r) => setTimeout(r, 200));

  const result: PushResult = {
    success: true,
    channel: "wechat",
    userId: user.id,
    message: sanitizedText,
    sentAt: new Date().toISOString(),
  };

  pushLog.push(result);
  return result;
}

export function getPushLog(): readonly PushResult[] {
  return pushLog;
}
