import { NudgeTone, NudgeCopy } from "./types";
import { chatCompletion, isLLMAvailable } from "./llm-client";

/**
 * AI Engine — 双模式文案批量生成引擎。
 * 模式 1 (LLM)：调用真实模型生成个性化文案
 * 模式 2 (Rules)：使用预定义模板作为降级
 */

/** 静态模板池 — 降级用 */
const TEMPLATE_POOL: Record<NudgeTone, string[]> = {
  empathetic: [
    "{user_name}，今天只差最后 {task_duration} 分钟的 {task_name} 啦，做完就能安心休息咯~",
    "知道你今天有点累，不过再坚持一下，完成 {task_name} 就可以好好放松啦！",
    "{user_name}，不要有压力哦，哪怕只完成一点点 {task_name} 也是进步！",
  ],
  motivational: [
    "哇！你是今天全站前 5% 的效率大师！继续保持连胜！",
    "优秀是一种习惯，{user_name}，完成 {task_name}，让今天的自己更强大！",
    "冲鸭！连胜 {streak} 天的你势不可挡，快去搞定 {task_name}！",
  ],
  humorous: [
    "呼叫 {user_name}！你的学习进度正在抗议，快来消灭 {task_name}！",
    "作业君说它很想你，特别是那个叫 {task_name} 的家伙！",
    "滴滴！前方高能预警，你的 {task_name} 正在向你招手！",
  ],
};

/** LLM 模式 — 调用模型生成单条文案 */
async function generateWithLLM(tone: NudgeTone): Promise<string | null> {
  const toneDesc: Record<NudgeTone, string> = {
    empathetic: "温柔共情，像知心朋友",
    motivational: "充满能量，像教练加油",
    humorous: "轻松幽默，用有趣的比喻",
  };

  const prompt = `请用"${toneDesc[tone]}"的语气，为中学生生成一条 30 字以内的学习提醒文案。
文案中使用 {user_name} 作为学生姓名占位符，{task_name} 作为任务名占位符。
只输出文案本身，不要包含引号或其他标点。`;

  return chatCompletion(
    "你是一位专业的学习激励文案撰写者。",
    prompt,
    { temperature: 0.95, maxTokens: 100 }
  );
}

/** 规则模式 — 从模板池随机选取 */
function generateFromTemplate(tone: NudgeTone): string {
  const pool = TEMPLATE_POOL[tone];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 批量生成文案 — 自动选择模式。
 * LLM 可用时走模型，不可用或失败时走模板降级。
 */
export async function generateCopiesBatch(
  tone: NudgeTone,
  count: number
): Promise<Omit<NudgeCopy, "id" | "targetSegment">[]> {
  const results: Omit<NudgeCopy, "id" | "targetSegment">[] = [];
  const useLLM = isLLMAvailable();

  for (let i = 0; i < count; i++) {
    let template: string;

    if (useLLM) {
      const llmResult = await generateWithLLM(tone);
      template = llmResult ?? generateFromTemplate(tone);
    } else {
      template = generateFromTemplate(tone);
    }

    results.push({
      tone,
      template,
      createdAt: new Date().toISOString(),
    });
  }

  return results;
}

/** 获取当前引擎模式 */
export function getEngineMode(): "llm" | "rules" {
  return isLLMAvailable() ? "llm" : "rules";
}
