"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, ChevronUp } from "lucide-react";

interface MiniRankCardProps {
  rankLevel: number;
  rankTitle: string;
}

export function MiniRankCard({ rankLevel, rankTitle }: MiniRankCardProps) {
  return (
    <Card className="border-none bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg overflow-hidden h-[120px]">
      <CardContent className="p-4 flex flex-col items-center justify-center h-full relative">
        <div className="absolute -top-2 -right-2 opacity-10">
          <Trophy className="h-16 w-16" />
        </div>
        
        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm mb-2">
          <Star className="h-5 w-5 fill-white text-white" />
        </div>
        
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-tighter opacity-80">Lv.{rankLevel}</p>
          <p className="text-xs font-black truncate max-w-[80px]">{rankTitle}</p>
        </div>
        
        <div className="mt-1 flex items-center gap-0.5 text-[8px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">
          <ChevronUp className="h-2 w-2" />
          RANK UP
        </div>
      </CardContent>
    </Card>
  );
}
