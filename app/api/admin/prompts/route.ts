import { NextRequest } from "next/server";
import { FEW_SHOT_TEMPLATES } from "@/lib/few-shot-prompts";
import { z } from "zod";

interface MutableTemplate {
  id: string;
  name: string;
  tone: string;
  systemPrompt: string;
  fewShotExamples: string[];
  isActive: boolean;
  updatedAt: string;
}

const mutableTemplates: MutableTemplate[] = FEW_SHOT_TEMPLATES.map((t) => ({
  id: t.id,
  name: t.name,
  tone: t.tone,
  systemPrompt: t.systemPrompt,
  fewShotExamples: [...t.examples],
  isActive: true,
  updatedAt: new Date().toISOString(),
}));

export async function GET() {
  return Response.json({ success: true, data: { templates: mutableTemplates } });
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: { code: "INVALID_BODY", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }

  const updateSchema = z.object({
    id: z.string(),
    systemPrompt: z.string().optional(),
    fewShotExamples: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  });

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues.map((i) => i.message).join("; ") } },
      { status: 400 }
    );
  }

  const idx = mutableTemplates.findIndex((t) => t.id === parsed.data.id);
  if (idx === -1) {
    return Response.json(
      { success: false, error: { code: "TEMPLATE_NOT_FOUND", message: `Template ${parsed.data.id} not found` } },
      { status: 404 }
    );
  }

  if (parsed.data.systemPrompt !== undefined) {
    mutableTemplates[idx].systemPrompt = parsed.data.systemPrompt;
  }
  if (parsed.data.fewShotExamples !== undefined) {
    mutableTemplates[idx].fewShotExamples = parsed.data.fewShotExamples;
  }
  if (parsed.data.isActive !== undefined) {
    mutableTemplates[idx].isActive = parsed.data.isActive;
  }
  mutableTemplates[idx].updatedAt = new Date().toISOString();

  return Response.json({ success: true, data: { template: mutableTemplates[idx] } });
}
