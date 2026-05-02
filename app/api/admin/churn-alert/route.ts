import { NextRequest } from "next/server";
import { detectChurnUsers, markParentNotified } from "@/services/churn-detector.server";
import { sendParentWeeklyReport } from "@/services/external-push.server";
import { MOCK_USERS, MOCK_TASKS } from "@/lib/mock-data";

export async function GET() {
  const churnUsers = detectChurnUsers();
  return Response.json({ success: true, data: { alerts: churnUsers } });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json(
      { success: false, error: { code: "INVALID_BODY", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }

  const userId = typeof body.userId === "string" ? body.userId : null;
  if (!userId) {
    return Response.json(
      { success: false, error: { code: "MISSING_USER_ID", message: "userId is required" } },
      { status: 400 }
    );
  }

  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user) {
    return Response.json(
      { success: false, error: { code: "USER_NOT_FOUND", message: `User ${userId} not found` } },
      { status: 404 }
    );
  }

  const tasks = MOCK_TASKS[userId] ?? [];
  const pushResult = await sendParentWeeklyReport(user, tasks);

  markParentNotified(userId);

  return Response.json({ success: true, data: { push: pushResult } });
}
