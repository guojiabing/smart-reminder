"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, MessageSquare, BrainCircuit, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AICompanionChat } from "../widget/ai-companion-chat";
import { User } from "@/lib/types";

interface AIMentalCardProps {
  user: User | null;
  pendingTaskCount: number;
}

export function AIMentalCard({ user, pendingTaskCount }: AIMentalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`border-none bg-gradient-to-br from-indigo-900/90 to-blue-900/90 text-white shadow-xl overflow-hidden relative transition-all duration-300 ${isExpanded ? "fixed inset-10 z-[100] h-auto" : "h-[120px]"}`}>
      <div className="absolute top-0 right-0 p-2 opacity-5">
        <MessageSquare className="h-12 w-12" />
      </div>
      
      {!isExpanded ? (
        <CardContent className="p-3 h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setIsExpanded(true)}>
          <div className="bg-white/10 p-2 rounded-xl mb-1.5">
            <MessageSquare className="h-5 w-5 text-blue-300" />
          </div>
          <p className="text-[10px] font-bold uppercase opacity-80">AI 树洞</p>
          <div className="mt-1 flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] opacity-60">在线对话</span>
          </div>
        </CardContent>
      ) : (
        <div className="flex flex-col h-full bg-zinc-950">
          <CardHeader className="pb-2 border-b border-white/10 bg-indigo-900">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider opacity-90">
                <Sparkles className="h-4 w-4 text-amber-400" /> AI 情绪树洞
              </CardTitle>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
              >
                <Maximize2 className="h-3.5 w-3.5 opacity-60" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <AICompanionChat 
              userId={user?.id || "user-passive-1"} 
              segment={user?.segment} 
              pendingTaskCount={pendingTaskCount} 
            />
          </CardContent>
        </div>
      )}
    </Card>
  );
}
