"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Data = {
  streak: number;
  week: { thisWeek: number; lastWeek: number; diff: number };
  badges: { id: string; emoji: string; name: string; desc: string; earned: boolean }[];
};

/** 연속 인증 불꽃, 지난주 비교, 뱃지 모음 */
export function Achievements() {
  const [d, setD] = useState<Data>();
  const [open, setOpen] = useState("");

  useEffect(() => {
    api<Data>("/api/achievements").then((r) => !r.error && setD(r));
  }, []);

  if (!d) return null;
  const fire = d.streak >= 7 ? "text-4xl" : d.streak >= 3 ? "text-3xl" : "text-2xl";
  const earned = d.badges.filter((b) => b.earned).length;
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <span className={`${fire} ${d.streak ? "" : "opacity-30 grayscale"}`}>🔥</span>
        <div className="flex-1">
          <div className="font-semibold">{d.streak ? `${d.streak}일 연속 인증 중!` : "오늘 인증하면 불꽃이 켜져요"}</div>
          <div className="text-sm text-zinc-500">
            이번 주 {d.week.thisWeek}분
            {d.week.lastWeek > 0 || d.week.thisWeek > 0
              ? d.week.diff > 0 ? ` · 지난주보다 +${d.week.diff}분 👍` : d.week.diff < 0 ? ` · 지난주보다 ${-d.week.diff}분 적어요, 조금만 더!` : " · 지난주와 같아요"
              : ""}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1 text-sm text-zinc-500">뱃지 {earned}/{d.badges.length}</div>
        <div className="grid grid-cols-4 gap-2">
          {d.badges.map((b) => (
            <button
              key={b.id}
              onClick={() => setOpen(open === b.id ? "" : b.id)}
              aria-label={`${b.name}: ${b.desc}${b.earned ? " (받음)" : ""}`}
              className={`flex min-h-11 flex-col items-center rounded-xl p-1 text-[11px] ${b.earned ? "bg-amber-50 dark:bg-amber-950" : "opacity-40 grayscale"}`}
            >
              <span className="text-2xl">{b.emoji}</span>
              {b.name}
            </button>
          ))}
        </div>
        {open && <p className="mt-2 text-center text-sm">{(() => { const b = d.badges.find((x) => x.id === open)!; return `${b.emoji} ${b.desc}${b.earned ? " — 받았어요!" : " — 도전해 봐요!"}`; })()}</p>}
      </div>
    </section>
  );
}
