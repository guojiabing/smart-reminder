"use client";

import { useState } from "react";
import { MessageSquare, X, Sparkles, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AICompanionChat } from "./ai-companion-chat";
import { useUser } from "@/hooks/use-user";
import { useTasks } from "@/hooks/use-tasks";

export function AIChatWidget({ userId = "user-passive-1" }: { userId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser(userId);
  const { pendingTasks } = useTasks(userId);

  return (
    <div className="fixed bottom-6 right-24 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.92, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 50, scale: 0.92, filter: "blur(10px)", transition: { duration: 0.25 } }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-96 w-85 overflow-hidden rounded-[2rem] border border-blue-100/50 bg-white/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:border-blue-900/30 dark:bg-zinc-950/90 pointer-events-auto"
          >
            <div className="relative flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 px-6 py-4 text-white">
              {/* Subtle Animated Glow in Header */}
              <div className="absolute inset-0 bg-[linear-gradient(110deg,#ffffff10,45%,#ffffff30,55%,#ffffff10)] bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
              
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-sm font-black tracking-tight leading-none">AI 情绪树洞</span>
                  <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Sentiment AI</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="relative rounded-full hover:bg-white/20 p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-3">
              <div className="rounded-[1.5rem] overflow-hidden bg-white/50 dark:bg-black/20">
                <AICompanionChat 
                  userId={userId} 
                  segment={user?.segment} 
                  pendingTaskCount={pendingTasks.length} 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, rotate: -5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-all ${
          isOpen 
            ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800" 
            : "bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-blue-500/30"
        }`}
      >
        <MessageSquare className="h-7 w-7" />
        {!isOpen && (
          <motion.span 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 border-4 border-zinc-50 dark:border-zinc-950"
          >
            <Sparkles className="h-3 w-3 text-white" />
          </motion.span>
        )}
      </motion.button>
      
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
