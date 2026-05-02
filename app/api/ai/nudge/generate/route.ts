import { NextRequest, NextResponse } from "next/server";
import { structuredCompletion, isLLMAvailable } from "@/lib/llm-client";
import { getTemplateByTone } from "@/lib/few-shot-prompts";
import { z } from "zod";

/**
 * AI Dynamic Nudge Generator
 * 双模式：LLM 可用时用 few-shot prompt 生成个性化文案，否则走规则降级。
 */

/** LLM 输出的结构化校验 schema */
const NudgeOutputSchema = z.object({
  greeting: z.string(),
  tone: z.enum(["empathetic", "motivational", "humorous"]),
  challenges: z.array(
    z.object({
      questionStem: z.string(),
      knowledgePoint: z.string(),
      encouragement: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
    })
  ),
  closingRemark: z.string(),
});

type NudgeOutput = z.infer<typeof NudgeOutputSchema>;

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { user, tasks, buddyStatus } = body as {
      user?: { name?: string; segment?: string; streakDays?: number; deskMateName?: string };
      tasks?: Array<{ title?: string; status?: string }>;
      buddyStatus?: unknown;
    };

    const pendingCount = tasks?.filter((t) => t.status !== "completed").length ?? 0;
    const streak = user?.streakDays ?? 0;
    const segment = user?.segment ?? "passive";
    const userName = user?.name ?? "同学";
    const buddyName = user?.deskMateName ?? "你的队友";
    const firstTaskTitle = tasks?.[0]?.title ?? "学习任务";

    // --- 尝试 LLM 模式 ---
    if (isLLMAvailable()) {
      const toneMap: Record<string, "empathetic" | "motivational" | "humorous"> = {
        passive: "empathetic",
        active: "motivational",
        "at-risk": "humorous",
      };
      const tone = toneMap[segment] ?? "empathetic";
      const template = getTemplateByTone(tone);

      const userPrompt = `请为以下学生生成一条学习提醒：
- 学生姓名：${userName}
- 用户画像：${segment}
- 连续学习天数：${streak}
- 待完成任务数：${pendingCount}
- 当前首要任务：${firstTaskTitle}
- 学习搭子：${buddyName}

请参考以下示例格式输出 JSON：
${template.examples[0]}`;

      const llmResult = await structuredCompletion<NudgeOutput>(
        template.systemPrompt,
        userPrompt,
        NudgeOutputSchema,
        { temperature: 0.85, maxTokens: 400 }
      );

      if (llmResult) {
        const message = `${llmResult.greeting} ${llmResult.challenges[0]?.encouragement ?? ""} ${llmResult.closingRemark}`;
        return NextResponse.json({
          message,
          structured: llmResult,
          timestamp: Date.now(),
          source: "llm",
        });
      }
    }

    // --- Fallback: 规则引擎 ---
    const generatedMessage = generateRuleBased(
      segment,
      userName,
      buddyName,
      streak,
      pendingCount,
      firstTaskTitle
    );

    return NextResponse.json({
      message: generatedMessage,
      timestamp: Date.now(),
      source: "rules",
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[AI Nudge] Error:", errMsg);
    return NextResponse.json({ error: "AI Generation failed" }, { status: 500 });
  }
}

function generateRuleBased(
  segment: string,
  userName: string,
  buddyName: string,
  streak: number,
  pendingCount: number,
  firstTaskTitle: string
): string {
  let msg = "";

  if (pendingCount === 0) {
    msg = `🎉 太棒了！${streak} 天连胜达成！今天的任务已全部清空，去享受你的自由时间吧，小天才！`;
  } else if (segment === "at-risk") {
    msg = `嘿，别让 ${streak} 天的努力断掉哦。我们只花 10 分钟看一眼 "${firstTaskTitle}" 好吗？我在陪着你呢。`;
  } else if (segment === "passive") {
    msg = `看到你的队友 ${buddyName} 还在努力吗？离今天的目标只差 ${pendingCount} 步啦，加把劲，一起早点休息！`;
  } else {
    msg = `专注状态拉满！"${firstTaskTitle}" 只需要你一鼓作气。${streak} 天的连胜火苗正在熊熊燃烧！🔥`;
  }

  const flairs = ["加油！", "你可以的！", "奥利给！", "冲冲冲！"];
  msg += ` ${flairs[Math.floor(Math.random() * flairs.length)]}`;

  return msg;
}
