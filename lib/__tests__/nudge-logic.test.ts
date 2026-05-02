/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { matchNudgeForUser } from "../nudge-matcher";
import { nudgeGovernor } from "../nudge-governor";
import { MOCK_USERS } from "../mock-data";

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
    localStorage.clear();
    vi.useFakeTimers();
  });

  it("should match an empathetic nudge for a passive user at appropriate time", () => {
    // 16:55 is appropriate for passive user (before 17:00 preferred)
    const result = matchNudgeForUser(user, tasks, 16, 55);
    expect(result.isAppropriateTime).toBe(true);
    expect(result.message).toContain("林晓");
    expect(result.message).toContain("Test Task");
  });

  it("should block nudges based on frequency control (Global Cooling)", () => {
    // First delivery
    nudgeGovernor.recordDelivery(user.id, "standard_nudge");
    
    // Immediate second attempt - should be blocked
    const result = matchNudgeForUser(user, tasks, 16, 55);
    expect(result.isAppropriateTime).toBe(false);
    expect(result.reason).toContain("Global cooling");
  });

  it("should allow nudges after cooling period", () => {
    nudgeGovernor.recordDelivery(user.id, "standard_nudge");
    
    // Fast forward 61 minutes (Global cooling 15m, Type cooling 60m)
    vi.advanceTimersByTime(61 * 60 * 1000);
    
    const result = matchNudgeForUser(user, tasks, 16, 55);
    expect(result.isAppropriateTime).toBe(true);
  });

  it("should provide motivational nudge when all tasks are completed", () => {
    const completedTasks = [{ ...tasks[0], status: "completed" as const }];
    const result = matchNudgeForUser(user, completedTasks);
    expect(result.isAppropriateTime).toBe(true);
    // Find motivational message (based on fallback copies)
    expect(result.message).toMatch(/保持你 \d+ 天的连胜记录|搞定/);
  });

  it("should handle invalid time gracefully", () => {
    const result = matchNudgeForUser(user, tasks, 3, 0); // 3 AM
    expect(result.isAppropriateTime).toBe(false);
    expect(result.message).toContain("处理任务");
  });
});
