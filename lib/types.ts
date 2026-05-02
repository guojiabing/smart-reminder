import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
  segment: z.enum(["active", "passive", "at-risk"]),
  streakDays: z.number().int().min(0),
  lastActiveAt: z.string(), // ISO date string
  preferredReminderTime: z.string().optional(), // "HH:mm", for passive users
  deskMateName: z.string().optional(), // for social leverage
  deskMateId: z.string().optional(), // linked user id
  isOnline: z.boolean().default(false),
  teamMateIds: z.array(z.string()).default([]),
  rankLevel: z.number().int().default(1),
  rankTitle: z.string().default("学习新手"),
});

export type User = z.infer<typeof UserSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  course: z.string(),
  durationMinutes: z.number().int().positive(),
  status: z.enum(["pending", "in-progress", "completed"]),
  dueDate: z.string(), // ISO date string
});

export type Task = z.infer<typeof TaskSchema>;

export const NudgeToneSchema = z.enum(["empathetic", "motivational", "humorous"]);
export type NudgeTone = z.infer<typeof NudgeToneSchema>;

export const NudgeCopySchema = z.object({
  id: z.string(),
  tone: z.enum(["empathetic", "motivational", "humorous"]),
  targetSegment: z.enum(["active", "passive", "at-risk", "all"]),
  template: z.string(), // e.g., "太棒了！今天只差 {task_name} 啦！"
  createdAt: z.string(),
  baseScore: z.number().min(0).max(10).optional(), // 0-10, AI evaluation score
  tags: z.array(z.string()).optional(), // e.g. ["urgent", "social", "night-owl"]
});

export type NudgeCopy = z.infer<typeof NudgeCopySchema>;

export const NudgeLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  copyId: z.string(),
  action: z.enum(["viewed", "clicked", "dismissed"]),
  timestamp: z.string(),
});

export type NudgeLog = z.infer<typeof NudgeLogSchema>;

// Admin stats response type
export type CopyStats = {
  tone: NudgeTone;
  views: number;
  clicks: number;
  ctr: number;
};

// Admin weight configuration
export type ToneWeights = Record<NudgeTone, number>;
