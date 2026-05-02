import { NextResponse } from "next/server";
import { MOCK_USERS, MOCK_TASKS } from "@/lib/mock-data";
import { matchNudgeForUser } from "@/lib/nudge-matcher";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "user-passive-1";
  const mockHourParam = searchParams.get("mockHour");
  const mockMinuteParam = searchParams.get("mockMinute");
  const mockHour = mockHourParam ? parseInt(mockHourParam, 10) : undefined;
  const mockMinute = mockMinuteParam ? parseInt(mockMinuteParam, 10) : undefined;
  
  const user = MOCK_USERS.find((u) => u.id === userId);
  const tasks = MOCK_TASKS[userId] || [];
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { message, isAppropriateTime } = matchNudgeForUser(user, tasks, mockHour, mockMinute);

  return NextResponse.json({ message, isAppropriateTime });
}
