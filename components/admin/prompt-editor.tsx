"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PromptTemplate {
  id: string;
  name: string;
  tone: string;
  systemPrompt: string;
  fewShotExamples: string[];
  isActive: boolean;
  updatedAt: string;
}

interface PromptEditorProps {
  templates: PromptTemplate[];
  onSave: (id: string, systemPrompt: string) => Promise<void>;
}

const toneLabel: Record<string, string> = {
  empathetic: "温情",
  motivational: "激励",
  humorous: "幽默",
};

export function PromptEditor({ templates, onSave }: PromptEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const handleSave = async (id: string) => {
    const value = editValues[id];
    if (!value) return;
    setSaving(id);
    await onSave(id, value);
    setSaving(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Prompt 模板管理</h3>

      {templates.map((tpl, i) => {
        const isExpanded = expandedId === tpl.id;
        return (
          <motion.div
            key={tpl.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          >
            <button
              onClick={() => {
                setExpandedId(isExpanded ? null : tpl.id);
                if (!editValues[tpl.id]) {
                  setEditValues((prev) => ({ ...prev, [tpl.id]: tpl.systemPrompt }));
                }
              }}
              className="flex w-full cursor-pointer items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {tpl.name}
                </span>
                <Badge variant="secondary">{toneLabel[tpl.tone] ?? tpl.tone}</Badge>
                {tpl.isActive && <Badge className="bg-green-600 text-white hover:bg-green-700">启用</Badge>}
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                <label className="mb-1 block text-xs font-medium text-zinc-500">System Prompt</label>
                <textarea
                  value={editValues[tpl.id] ?? tpl.systemPrompt}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, [tpl.id]: e.target.value }))
                  }
                  rows={5}
                  className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />

                <div className="mt-2">
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    Few-shot 示例 ({tpl.fewShotExamples.length})
                  </label>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                    {tpl.fewShotExamples.map((ex, j) => (
                      <pre key={j} className="mb-1 whitespace-pre-wrap break-all">{ex.slice(0, 200)}...</pre>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    更新于: {new Date(tpl.updatedAt).toLocaleString("zh-CN")}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleSave(tpl.id)}
                    disabled={saving === tpl.id}
                    className="gap-1"
                  >
                    {saving === tpl.id ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    热更新
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
