import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateCopiesBatch, getEngineMode } from "../ai-engine";

describe("AI Engine — 双模式引擎测试", () => {
  beforeEach(() => {
    // 清除环境变量缓存
    vi.unstubAllEnvs();
  });

  it("无 API Key 时应走规则降级模式", () => {
    vi.stubEnv("AI_API_KEY", "");
    expect(getEngineMode()).toBe("rules");
  });

  it("有 API Key 时应检测为 LLM 模式", () => {
    vi.stubEnv("AI_API_KEY", "sk-test-key");
    expect(getEngineMode()).toBe("llm");
  });

  it("规则模式应生成指定数量的文案", async () => {
    vi.stubEnv("AI_API_KEY", "");
    const results = await generateCopiesBatch("empathetic", 3);
    expect(results).toHaveLength(3);
    results.forEach((r) => {
      expect(r.tone).toBe("empathetic");
      expect(r.template).toBeTruthy();
      expect(r.createdAt).toBeTruthy();
    });
  });

  it("规则模式各语气都能正常生成", async () => {
    vi.stubEnv("AI_API_KEY", "");
    const tones = ["empathetic", "motivational", "humorous"] as const;

    for (const tone of tones) {
      const results = await generateCopiesBatch(tone, 2);
      expect(results).toHaveLength(2);
      expect(results[0].tone).toBe(tone);
    }
  });

  it("生成 0 条时应返回空数组", async () => {
    vi.stubEnv("AI_API_KEY", "");
    const results = await generateCopiesBatch("empathetic", 0);
    expect(results).toHaveLength(0);
  });
});
