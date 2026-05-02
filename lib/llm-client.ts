import OpenAI from "openai";
import { z } from "zod";

/**
 * LLM Client — 统一网关，封装 OpenAI SDK 调用。
 * 支持超时降级、结构化输出校验。
 */

const LLM_TIMEOUT_MS = 5000;

/** 检测 LLM 配置是否可用 */
export function isLLMAvailable(): boolean {
  return !!(process.env.AI_API_KEY && process.env.AI_API_KEY.length > 0);
}

/** 创建 OpenAI 客户端实例（支持兼容 API 基地址） */
function createClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.AI_API_KEY ?? "",
    baseURL: process.env.AI_API_BASE || undefined,
    timeout: LLM_TIMEOUT_MS,
  });
}

/** 通用聊天补全 — 返回纯文本 */
export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string | null> {
  if (!isLLMAvailable()) return null;

  const client = createClient();
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxTokens ?? 300,
    });

    return response.choices[0]?.message?.content ?? null;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[LLM] Chat completion failed, falling back to rules:", errMsg);
    return null;
  }
}

/**
 * 结构化 JSON 补全 — 返回经 Zod 校验的对象。
 * 若 LLM 输出格式不合法，返回 null 触发降级。
 */
export async function structuredCompletion<T>(
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodType<T>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<T | null> {
  const raw = await chatCompletion(
    systemPrompt + "\n\n请严格以 JSON 格式输出，不要包含任何多余文本。",
    userMessage,
    options
  );

  if (!raw) return null;

  try {
    // 尝试从 markdown code block 中提取 JSON
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
    const parsed: unknown = JSON.parse(jsonStr);
    const result = schema.safeParse(parsed);

    if (result.success) {
      return result.data;
    }

    console.error("[LLM] Structured output validation failed:", result.error.issues);
    return null;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[LLM] JSON parsing failed:", errMsg);
    return null;
  }
}

/**
 * 流式聊天补全 — 返回 ReadableStream 供 SSE 推送。
 * 若 LLM 不可用，返回 null。
 */
export async function streamingCompletion(
  systemPrompt: string,
  userMessage: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<ReadableStream<Uint8Array> | null> {
  if (!isLLMAvailable()) return null;

  const client = createClient();
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxTokens ?? 500,
      stream: true,
    });

    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (streamError: unknown) {
          const errMsg = streamError instanceof Error ? streamError.message : String(streamError);
          console.error("[LLM] Stream error:", errMsg);
          controller.close();
        }
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[LLM] Streaming failed:", errMsg);
    return null;
  }
}
