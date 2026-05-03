import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { matchNudgeForUser } from "../nudge-matcher";
import { nudgeGovernor } from "../nudge-governor";
import { MOCK_USERS, FALLBACK_COPIES } from "../mock-data";
import { storageAdapter } from "../storage-adapter";
import type { NudgeCopy } from "../types";

const copies: NudgeCopy[] = FALLBACK_COPIES;
const allUsers = MOCK_USERS;

describe("Nudge Logic & Scoring Engine", () => {
  const user = MOCK_USERS[0]; // passive user
  const tasks = [
    {
      id: "task-test",
      title: "Test Task",
      course: "Math",
      durationMinutes: 20,
      status: "pending" as const,
      dueDate: new Date().toISOString(),
    }
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    storageAdapter.clearAll();
    nudgeGovernor.clearHistory(user.id);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should match an empathetic nudge for a passive user at appropriate time", () => {
    const result = matchNudgeForUser(user, tasks, copies, allUsers, 16, 55);
    expect(result.isAppropriateTime).toBe(true);
    expect(result.message).toContain("林晓");
    expect(result.message).toContain("Test Task");
  });

  it("should block nudges based on frequency control (Global Cooling)", () => {
    nudgeGovernor.recordDelivery(user.id, "standard_nudge");
    const result = matchNudgeForUser(user, tasks, copies, allUsers, 16, 55);
    expect(result.isAppropriateTime).toBe(false);
    expect(result.reason).toContain("Global cooling");
  });

  it("should allow nudges after cooling period", () => {
    nudgeGovernor.recordDelivery(user.id, "standard_nudge");
    vi.advanceTimersByTime(61 * 60 * 1000);
    const result = matchNudgeForUser(user, tasks, copies, allUsers, 16, 55);
    expect(result.isAppropriateTime).toBe(true);
  });

  it("should provide motivational nudge when all tasks are completed", () => {
    const completedTasks = [{ ...tasks[0], status: "completed" as const }];
    const result = matchNudgeForUser(user, completedTasks, copies, allUsers);
    expect(result.isAppropriateTime).toBe(true);
    expect(result.copyId).toBeTruthy();
  });

  it("should handle invalid time gracefully", () => {
    const result = matchNudgeForUser(user, tasks, copies, allUsers, 3, 0);
    expect(result.isAppropriateTime).toBe(false);
    expect(result.message).toContain("处理任务");
  });
});
