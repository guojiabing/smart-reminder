import { User, Task, NudgeCopy } from "./types";
import { db, MOCK_USERS } from "./mock-data";
import { nudgeGovernor } from "./nudge-governor";

/**
 * Intelligent Nudge Matcher with Scoring Engine.
 * Scores candidates based on Persona, Context, and History.
 * 集成同伴决策：队友完成进度影响文案策略。
 */
export function matchNudgeForUser(
  user: User, 
  tasks: Task[], 
  mockHour?: number,
  mockMinute?: number
): { message: string | null; isAppropriateTime: boolean; reason?: string } {
  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  
  // 1. Basic Availability Check
  if (pendingTasks.length === 0 && tasks.length > 0) {
    // All tasks completed - motivational celebrating nudge
    const candidates = db.generatedCopies.filter(c => c.tone === "motivational");
    const best = selectBestCandidate(candidates, user, null);
    return { message: interpolate(best.template, user, null), isAppropriateTime: true };
  }

  if (pendingTasks.length === 0) {
    return { message: null, isAppropriateTime: true };
  }

  const nextTask = pendingTasks[0];
  const now = new Date();
  const currentHour = mockHour !== undefined ? mockHour : now.getHours();
  const currentMinute = mockMinute !== undefined ? mockMinute : now.getMinutes();

  // 2. Frequency Control Check
  const freqCheck = nudgeGovernor.isAllowed(user.id, "standard_nudge");
  if (!freqCheck.allowed) {
    return { 
      message: "正在专注学习中，我会静静陪伴你...", // Quiet mode
      isAppropriateTime: false,
      reason: freqCheck.reason 
    };
  }

  // 3. Segment-specific Timing Rules
  let isAppropriateTime = false;
  let fallbackMessage = "";

  if (user.segment === "active") {
    isAppropriateTime = currentHour === 21;
    fallbackMessage = `自驱型学霸无需打扰，如果 21:00 还没完成「${nextTask.title}」，我再来提醒你~`;
  } else if (user.segment === "passive") {
    if (user.preferredReminderTime) {
      const [pHour, pMin] = user.preferredReminderTime.split(":").map(Number);
      const diff = (pHour * 60 + pMin) - (currentHour * 60 + currentMinute);
      isAppropriateTime = diff > 0 && diff <= 15; // Increased window to 15m
    }
    if (!isAppropriateTime) {
      isAppropriateTime = (currentHour >= 16 && currentHour < 18) || (currentHour >= 19 && currentHour < 21);
      fallbackMessage = `被动型学生建议在 17:00 或 20:00 前处理任务，目前处于非提醒高峰。`;
    }
  } else if (user.segment === "at-risk") {
    isAppropriateTime = true; // Always allow for at-risk users
  }

  if (!isAppropriateTime) {
    return { 
      message: fallbackMessage,
      isAppropriateTime: false 
    };
  }

  // 4. 同伴决策闭环：队友完成进度影响文案权重
  const buddyProgress = getBuddyProgress(user);
  
  // 5. Scoring Engine Selection（集成同伴信号）
  const candidates = db.generatedCopies.filter(c => 
    c.targetSegment === user.segment || c.targetSegment === "all" || c.tone === getPreferredTone(user.segment)
  );
  
  const bestCopy = selectBestCandidate(candidates, user, nextTask, buddyProgress);
  
  // Record delivery (for mock persistence)
  // nudgeGovernor.recordDelivery(user.id, "standard_nudge");

  return { message: interpolate(bestCopy.template, user, nextTask), isAppropriateTime: true };
}

/** 获取队友的学习进度信号 */
interface BuddyProgress {
  buddyName: string;
  buddyCompletionRate: number;
  buddyIsOnline: boolean;
}

function getBuddyProgress(user: User): BuddyProgress | null {
  if (!user.deskMateId) return null;

  const buddy = MOCK_USERS.find((u) => u.id === user.deskMateId);
  if (!buddy) return null;

  // 从 mock 任务数据中计算队友的完成率
  const buddyTasks = db.generatedCopies; // 简化：用队友的 streakDays 作为进度指标
  const completionRate = Math.min(buddy.streakDays / 30, 1); // 归一化到 0~1

  return {
    buddyName: buddy.name,
    buddyCompletionRate: completionRate,
    buddyIsOnline: buddy.isOnline ?? false,
  };
}

/**
 * Scores each candidate and returns the one with the highest score.
 * 集成同伴进度信号增强评分。
 */
function selectBestCandidate(
  candidates: NudgeCopy[],
  user: User,
  task: Task | null,
  buddyProgress?: BuddyProgress | null
): NudgeCopy {
  if (candidates.length === 0) return db.generatedCopies[0];

  const scores = candidates.map(copy => {
    let score = copy.baseScore || 5;

    // Persona Match
    if (copy.targetSegment === user.segment) score += 3;
    
    // Preferred Tone Match
    if (copy.tone === getPreferredTone(user.segment)) score += 2;

    // Contextual Tags
    if (task && task.durationMinutes > 30 && copy.tags?.includes("efficient")) score += 1;
    if (user.streakDays > 7 && copy.tags?.includes("streak")) score += 1.5;
    if (user.deskMateName && copy.tags?.includes("social")) score += 1;

    // 同伴决策加权：队友在线且完成率高 → 提升社交压力型文案权重
    if (buddyProgress) {
      if (buddyProgress.buddyIsOnline && copy.tags?.includes("social")) {
        score += 2; // 队友在线，社交文案加权
      }
      if (buddyProgress.buddyCompletionRate > 0.5 && copy.tags?.includes("competitive")) {
        score += 1.5; // 队友完成率高，竞争文案加权
      }
    }

    // Add slight randomness to avoid repetitive feel
    score += Math.random();

    return { copy, score };
  });

  return scores.sort((a, b) => b.score - a.score)[0].copy;
}

function getPreferredTone(segment: string): string {
  switch (segment) {
    case "active": return "motivational";
    case "passive": return "empathetic";
    case "at-risk": return "humorous";
    default: return "empathetic";
  }
}

function interpolate(template: string, user: User, task: Task | null): string {
  let result = template
    .replace(/{user_name}/g, user.name)
    .replace(/{streak}/g, user.streakDays.toString())
    .replace(/{buddy_name}/g, user.deskMateName || "你的队友");

  if (task) {
    result = result
      .replace(/{task_name}/g, task.title)
      .replace(/{task_duration}/g, task.durationMinutes.toString());
  }

  return result;
}
