import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, streamingCompletion, isLLMAvailable } from "@/lib/llm-client";

/**
 * AI Companion Chat API
 * 双模式：LLM 可用时走真实模型，不可用时走规则引擎降级。
 * 支持 streaming 响应。
 */

const SYSTEM_PROMPT = `你是一位温暖、专业的学习陪伴助手"小智"。你的职责是：
1. 倾听学生的情绪，给予共情回应
2. 当学生疲惫时给予鼓励，但不居高临下
3. 适当提供学习方法建议
4. 语言风格：温暖、轻松、像一个知心朋友
5. 回复控制在 50 字以内，简洁有力
6. 可以使用 1-2 个 emoji 增加亲和感`;

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { message, userContext, stream } = body as {
      message?: string;
      userContext?: { pendingTaskCount?: number };
      stream?: boolean;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const contextHint = userContext?.pendingTaskCount
      ? `\n[上下文：该学生当前有 ${userContext.pendingTaskCount} 个待完成任务]`
      : "";

    // --- 尝试 Streaming 模式 ---
    if (stream && isLLMAvailable()) {
      const sseStream = await streamingCompletion(
        SYSTEM_PROMPT + contextHint,
        message
      );

      if (sseStream) {
        return new Response(sseStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
    }

    // --- 尝试 LLM 非流式 ---
    const llmReply = await chatCompletion(
      SYSTEM_PROMPT + contextHint,
      message,
      { temperature: 0.9, maxTokens: 200 }
    );

    if (llmReply) {
      return NextResponse.json({
        reply: llmReply,
        timestamp: Date.now(),
        source: "llm",
      });
    }

    // --- Fallback: 规则引擎 ---
    const reply = ruleBasedReply(message, userContext?.pendingTaskCount ?? 0);

    return NextResponse.json({
      reply,
      timestamp: Date.now(),
      source: "rules",
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[Chat API] Error:", errMsg);
    return NextResponse.json(
      { error: "Failed to connect to AI companion" },
      { status: 500 }
    );
  }
}

/** 规则引擎降级 — 保留原有逻辑作为兜底 */
function ruleBasedReply(message: string, pendingTaskCount: number): string {
  const input = message.toLowerCase();

  if (input.includes("累") || input.includes("tired") || input.includes("摸鱼")) {
    return "辛苦啦！我看你今天已经专注很久了。要不先深呼吸 3 次？休息是为了更好的冲刺！☕";
  }
  if (input.includes("压力") || input.includes("stressed") || input.includes("难")) {
    return "感受到你的紧绷了。别担心，这些任务拆解开来也还好。我们慢慢来。💜";
  }
  if (input.includes("没思路") || input.includes("stuck") || input.includes("不会")) {
    return "大脑卡住了吗？试试切出任务 10 分钟，把'思路卡点'交给潜意识？🧠✨";
  }
  if (input.includes("搞定") || input.includes("完成") || input.includes("开心") || input.includes("happy")) {
    return "太棒了！看到那个完成率跳上去，我也想为你放个礼花！🎉 你超棒的！";
  }
  if (input.includes("嗨") || input.includes("你好") || input.includes("在吗")) {
    return `我在呢！你还有 ${pendingTaskCount} 个任务待处理。今天我们也一起加油吧！👋`;
  }

  const fallbacks = [
    "原来是这样呀，我一直在听着呢。说出来心情会好很多吧？加油，我在！",
    "没关系，专注当下的每一秒，你已经在超越昨天的自己了。🐾",
    "我在后台悄悄记录了你的每一分努力。即便没人看见，我也一直在这里为你鼓劲。",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
