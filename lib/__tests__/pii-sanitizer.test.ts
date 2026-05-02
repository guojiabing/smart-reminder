import { describe, it, expect } from "vitest";
import { sanitizePii } from "../../services/pii-sanitizer";

describe("PII Sanitizer — 脱敏测试", () => {
  it("应脱敏真实姓名", () => {
    const result = sanitizePii("林晓同学的成绩很好", "林晓");
    expect(result.sanitizedText).toContain("[学生]");
    expect(result.sanitizedText).not.toContain("林晓");
    expect(result.piiFound).toBe(true);
  });

  it("应脱敏手机号", () => {
    const result = sanitizePii("电话 13812345678 请联系");
    expect(result.sanitizedText).not.toContain("13812345678");
    expect(result.piiFound).toBe(true);
  });

  it("应脱敏邮箱", () => {
    const result = sanitizePii("邮箱是 test@example.com");
    expect(result.sanitizedText).toContain("[邮箱]");
    expect(result.sanitizedText).not.toContain("test@example.com");
  });

  it("应脱敏学校名称", () => {
    const result = sanitizePii("就读于北京实验中学", undefined, "北京实验中学");
    expect(result.sanitizedText).toContain("[学校]");
    expect(result.sanitizedText).not.toContain("北京实验中学");
  });

  it("无 PII 数据时应返回原文", () => {
    const result = sanitizePii("今天天气不错");
    expect(result.sanitizedText).toBe("今天天气不错");
    expect(result.piiFound).toBe(false);
    expect(result.replacementCount).toBe(0);
  });

  it("空字符串应安全处理", () => {
    const result = sanitizePii("");
    expect(result.sanitizedText).toBe("");
    expect(result.piiFound).toBe(false);
  });

  it("应正确统计替换次数", () => {
    const result = sanitizePii(
      "林晓同学的邮箱是 test@example.com，电话 13812345678",
      "林晓"
    );
    expect(result.replacementCount).toBeGreaterThanOrEqual(3);
  });
});
