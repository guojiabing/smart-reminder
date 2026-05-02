"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Sparkles, Smile, Frown, Coffee, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { produce } from "immer";

interface Message {
  id: string;
  text: string;
  isAi: boolean;
  timestamp: number;
}

interface AICompanionChatProps {
  userId: string;
  segment?: string;
  pendingTaskCount: number;
}

const MOOD_CHIPS = [
  { id: "tired", label: "累了", icon: Coffee, color: "bg-orange-100 text-orange-600" },
  { id: "stressed", label: "压力大", icon: Frown, color: "bg-purple-100 text-purple-600" },
  { id: "stuck", label: "没思路", icon: Brain, color: "bg-blue-100 text-blue-600" },
  { id: "happy", label: "搞定了", icon: Smile, color: "bg-green-100 text-green-600" },
];

export function AICompanionChat({ userId, segment, pendingTaskCount }: AICompanionChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      text: "嗨！学习辛苦啦，有什么想和我聊聊的吗？无论是压力大还是想吐槽都可以哦。",
      isAi: true,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial display sync
  useEffect(() => {
    setDisplayMessages(messages);
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [displayMessages, isTyping]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      isAi: false,
      timestamp: Date.now(),
    };

    setMessages(produce((draft) => {
      draft.push(userMsg);
    }));
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userContext: { segment, pendingTaskCount },
        }),
      });

      const data = await response.json();
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        isAi: true,
        timestamp: Date.now(),
      };

      setMessages(produce((draft) => {
        draft.push(aiMsg);
      }));
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-none"
      >
        <AnimatePresence initial={false}>
          {displayMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.9, originX: msg.isAi ? 0 : 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.isAi ? "justify-start" : "justify-end"}`}
            >
              <div className={`flex gap-3 max-w-[88%] ${msg.isAi ? "flex-row" : "flex-row-reverse"}`}>
                <div className={`h-8 w-8 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  msg.isAi ? "bg-white/20 backdrop-blur-md text-white" : "bg-blue-500 text-white"
                }`}>
                  {msg.isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className={`relative rounded-3xl px-4 py-2.5 text-sm shadow-md transition-all ${
                  msg.isAi 
                    ? "bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-tl-none" 
                    : "bg-blue-600 text-white rounded-tr-none"
                }`}>
                  {msg.text}
                  {msg.isAi && (
                    <div className="absolute -left-1.5 top-0 text-white/10">
                      <Sparkles className="h-3 w-3 fill-current" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start pl-11"
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 flex gap-1.5 items-center">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Mood Chips & Input Section */}
      <div className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-sm">
        {/* Mood Chips */}
        {!isTyping && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
            {MOOD_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleSend(chip.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap bg-white/10 text-white hover:bg-white/20`}
              >
                <chip.icon className="h-3 w-3" />
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="和我聊聊你的心情..."
            className="relative w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-2xl py-3 pl-5 pr-12 text-xs focus:outline-none focus:border-blue-400/50 transition-all backdrop-blur-md"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 h-8 w-8 rounded-xl bg-blue-500 text-white flex items-center justify-center disabled:opacity-30 transition-all hover:bg-blue-600 active:scale-90"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
