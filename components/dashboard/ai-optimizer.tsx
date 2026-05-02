"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, BrainCircuit, Timer, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, User } from "@/lib/types";

interface AIOptimizerProps {
  user: User | null;
  tasks: Task[];
  onStartTask: (id: string) => void;
}

export function AIOptimizer({ user, tasks, onStartTask }: AIOptimizerProps) {
  const [optimizedTask, setOptimizedTask] = useState<Task | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    const optimize = async () => {
      const pending = tasks.filter(t => t.status !== "completed");
      if (pending.length === 0) {
        setOptimizedTask(null);
        return;
      }

      setIsOptimizing(true);
      // Simulate AI Analysis
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simple heuristic for demo: 
      // If user is "active", suggest the longest task (Eat the frog).
      // If user is "at-risk", suggest the shortest task (Quick win).
      
      let selected: Task;
      let reason = "";

      if (user?.segment === "active") {
        selected = [...pending].sort((a, b) => b.durationMinutes - a.durationMinutes)[0];
        reason = `当前处于高效时段，建议先处理挑战最大的 "${selected.title}"，即刻“吞掉青蛙”！`;
      } else if (user?.segment === "at-risk") {
        selected = [...pending].sort((a, b) => a.durationMinutes - b.durationMinutes)[0];
        reason = `先从最简单的 "${selected.title}" 开始吧，只需要 ${selected.durationMinutes} 分钟，找回掌控感。`;
      } else {
        selected = pending[0];
        reason = `按照原定计划进行，"${selected.title}" 是目前最紧迫的任务。`;
      }

      setOptimizedTask(selected);
      setReasoning(reason);
      setIsOptimizing(false);
    };

    optimize();
  }, [user?.id, tasks.length]);

  return (
    <Card className="border-none bg-zinc-900 text-white shadow-xl dark:bg-white dark:text-black overflow-hidden relative min-h-[160px]">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <BrainCircuit className="h-20 w-20" />
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider opacity-80">
          <Sparkles className="h-4 w-4 text-blue-400" /> AI 方案优化
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          {isOptimizing ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "200ms" }} />
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "400ms" }} />
                <span className="text-xs font-medium opacity-60">正在分析学习历史与专注度...</span>
              </div>
            </motion.div>
          ) : optimizedTask ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <p className="text-xs opacity-70 leading-relaxed mb-3 italic">
                  {reasoning}
                </p>
                <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3 dark:bg-black/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{optimizedTask.title}</p>
                    <p className="text-[10px] opacity-50">{optimizedTask.course} · {optimizedTask.durationMinutes} min</p>
                  </div>
                  <button 
                    onClick={() => onStartTask(optimizedTask.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white transition-transform hover:scale-110 active:scale-95"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 flex flex-col items-center text-center space-y-3"
            >
              <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">今日目标已圆满达成！</p>
                <p className="text-[10px] opacity-50 px-4 mt-1 leading-relaxed">
                  AI 评估你的专注力等级为“卓越”。建议现在进行 20 分钟的冥想或户外散步。
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
