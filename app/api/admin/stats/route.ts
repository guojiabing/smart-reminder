import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tones = ["empathetic", "motivational", "humorous"] as const;

  const [statsRaw, weights, totalCopies] = await Promise.all([
    Promise.all(
      tones.map(async (tone) => {
        const [views, clicks] = await Promise.all([
          prisma.nudgeLog.count({ where: { tone, action: "nudge_viewed" } }),
          prisma.nudgeLog.count({ where: { tone, action: "nudge_clicked" } }),
        ]);
        return { tone, views, clicks, ctr: views > 0 ? (clicks / views) * 100 : 0 };
      }),
    ),
    prisma.toneWeight.findMany(),
    prisma.nudgeCopy.count(),
  ]);

  const weightMap: Record<string, number> = {};
  for (const w of weights) weightMap[w.tone] = w.weight;

  return NextResponse.json({
    stats: statsRaw,
    weights: weightMap,
    totalCopies,
  });
}
