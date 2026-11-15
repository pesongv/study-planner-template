"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type ClassInfo = { cheer: string; goalHours: number; minutes: number };

/** 선생님 응원 메시지 + 학급 공동 목표 막대 */
export function ClassBanner() {
  const [c, setC] = useState<ClassInfo>();

  useEffect(() => {
    api<ClassInfo>("/api/class").then((r) => !r.error && setC(r));
  }, []);

  if (!c || (!c.cheer && !c.goalHours)) return null;
  const hours = Math.floor(c.minutes / 60);
  const pct = c.goalHours ? Math.min(100, (c.minutes / 60 / c.goalHours) * 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      {c.cheer && (
        <div className="rounded-2xl bg-amber-100 px-4 py-3 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
          📣 <b>선생님:</b> {c.cheer}
        </div>
      )}
      {c.goalHours > 0 && (
        <div className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="mb-1 flex justify-between text-sm">
            <span>🎯 우리 반 공동 목표 <b>{c.goalHours}시간</b></span>
            <span className="text-zinc-500">{hours}시간 모았어요{pct >= 100 && " 🎉 달성!"}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
