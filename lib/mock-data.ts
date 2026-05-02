import { User, Task, NudgeCopy, ToneWeights } from "./types";

export const MOCK_USERS: User[] = [
  {
    id: "user-passive-1",
    name: "林晓",
    segment: "passive",
    streakDays: 4,
    lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    preferredReminderTime: "17:00",
    deskMateName: "张博",
    deskMateId: "user-active-1",
    isOnline: true,
    teamMateIds: ["user-active-1"],
    rankLevel: 5,
    rankTitle: "中坚力量",
  },
  {
    id: "user-active-1",
    name: "张博",
    segment: "active",
    streakDays: 42,
    lastActiveAt: new Date().toISOString(),
    deskMateName: "林晓",
    deskMateId: "user-passive-1",
    isOnline: true,
    teamMateIds: ["user-passive-1"],
    rankLevel: 12,
    rankTitle: "学神附体",
  },
  {
    id: "user-risk-1",
    name: "王超",
    segment: "at-risk",
    streakDays: 0,
    lastActiveAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    deskMateName: "张博",
    deskMateId: "user-active-1",
    isOnline: false,
    teamMateIds: ["user-active-1"],
    rankLevel: 1,
    rankTitle: "暂露头角",
  },
];

export const MOCK_TASKS: Record<string, Task[]> = {
  "user-passive-1": [
    {
      id: "task-1",
      title: "阅读小测: 鲁迅文集",
      course: "语文",
      durationMinutes: 10,
      status: "pending",
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "task-2",
      title: "一元二次方程练习",
      course: "数学",
      durationMinutes: 25,
      status: "completed",
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "task-3",
      title: "英语听力 15 篇",
      course: "英语",
      durationMinutes: 15,
      status: "completed",
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "user-active-1": [
    {
      id: "task-4",
      title: "物理力学综合挑战",
      course: "物理",
      durationMinutes: 45,
      status: "pending",
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "user-risk-1": [
    {
      id: "task-5",
      title: "单词打卡",
      course: "英语",
      durationMinutes: 5,
      status: "pending",
      dueDate: new Date().toISOString(),
    }
  ]
};

export const FALLBACK_COPIES: NudgeCopy[] = [
  {
    id: "fb-emp-1",
    tone: "empathetic",
    targetSegment: "passive",
    template: "{user_name}同学，你的{task_name}任务还差一点就完成啦，现在开始 5 分钟就能搞定！",
    createdAt: new Date().toISOString(),
    baseScore: 8.5,
    tags: ["efficient", "gentle"],
  },
  {
    id: "fb-mot-1",
    tone: "motivational",
    targetSegment: "active",
    template: "完成今日{task_name}，保持你 {streak} 天的连胜记录！你是最棒的！",
    createdAt: new Date().toISOString(),
    baseScore: 9.0,
    tags: ["streak", "honor"],
  },
  {
    id: "fb-hum-1",
    tone: "humorous",
    targetSegment: "at-risk",
    template: "呼叫 {user_name}！完成本次{task_name}即可领取“连续学习奖励”刺激包哦！🎁",
    createdAt: new Date().toISOString(),
    baseScore: 7.5,
    tags: ["reward", "fun"],
  },
  {
    id: "fb-soc-1",
    tone: "humorous",
    targetSegment: "at-risk",
    template: "和你一起学习的 {buddy_name} 已经完成了今天的任务，就差你啦！快来追上他！🚀",
    createdAt: new Date().toISOString(),
    baseScore: 9.5,
    tags: ["social", "competitive"],
  },
];

// In-memory mock database for generated copies
export const db = {
  generatedCopies: [...FALLBACK_COPIES],
  weights: {
    empathetic: 0.6,
    motivational: 0.3,
    humorous: 0.1,
  } as ToneWeights,
  // Mock tracking stats: clicks / views
  stats: {
    empathetic: { views: 1200, clicks: 216 }, // 18%
    motivational: { views: 800, clicks: 40 }, // 5%
    humorous: { views: 400, clicks: 32 }, // 8%
  },
};
