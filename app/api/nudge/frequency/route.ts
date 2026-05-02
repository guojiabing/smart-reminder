import { NextRequest, NextResponse } from "next/server";

/**
 * 服务端频控 API
 * 将频控状态从客户端 localStorage 迁移到服务端内存，
 * 确保频控决策不可被客户端绕过。
 */

interface FrequencyRecord {
  userId: string;
  type: string;
  timestamp: number;
}

// 服务端内存频控存储（生产环境应替换为 Redis）
const frequencyStore = new Map<string, FrequencyRecord[]>();

const GLOBAL_COOLING_MS = 15 * 60 * 1000; // 15 分钟全局冷却
const TYPE_COOLING_MS = 60 * 60 * 1000; // 60 分钟同类型冷却
const MAX_DAILY_NUDGES = 5; // 每日最大推送次数
const DAY_MS = 24 * 60 * 60 * 1000;

/** GET: 查询用户频控状态 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const records = frequencyStore.get(userId) ?? [];
  const now = Date.now();

  // 检查全局冷却
  const lastRecord = records[0];
  if (lastRecord && now - lastRecord.timestamp < GLOBAL_COOLING_MS) {
    const remainMs = GLOBAL_COOLING_MS - (now - lastRecord.timestamp);
    return NextResponse.json({
      allowed: false,
      reason: "global_cooling",
      remainSeconds: Math.ceil(remainMs / 1000),
      todayCount: getDailyCount(records, now),
    });
  }

  // 检查每日上限
  const dailyCount = getDailyCount(records, now);
  if (dailyCount >= MAX_DAILY_NUDGES) {
    return NextResponse.json({
      allowed: false,
      reason: "daily_limit",
      todayCount: dailyCount,
    });
  }

  return NextResponse.json({
    allowed: true,
    todayCount: dailyCount,
  });
}

/** POST: 记录一次投递事件 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const userId = typeof body.userId === "string" ? body.userId : null;
  const type = typeof body.type === "string" ? body.type : "standard_nudge";

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const records = frequencyStore.get(userId) ?? [];
  const newRecord: FrequencyRecord = { userId, type, timestamp: Date.now() };

  // 保留最近 100 条，防止内存膨胀
  const updated = [newRecord, ...records].slice(0, 100);
  frequencyStore.set(userId, updated);

  return NextResponse.json({
    recorded: true,
    todayCount: getDailyCount(updated, Date.now()),
  });
}

function getDailyCount(records: FrequencyRecord[], now: number): number {
  const dayStart = now - DAY_MS;
  return records.filter((r) => r.timestamp > dayStart).length;
}
