"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { CERT_NEED } from "@/lib/journal";

type Status = { todo: boolean; timer: boolean; reflection: boolean; quiz: boolean; count: number; done: boolean };
const ITEMS: [keyof Status, string, string][] = [
  ["todo", "할 일 체크", "/plan"],
  ["timer", "타이머 25분", ""],
  ["reflection", "한 줄 평", "/journal"],
  ["quiz", "퀴즈", "/journal"],
];

/** 오늘 인증 카드: 4가지 중 2개 이상이면 완료 */
export function TodayCert() {
  const [s, setS] = useState<Status>();

  useEffect(() => {
    api<Status>("/api/today-status").then((r) => !r.error && setS(r));
  }, []);

  if (!s) return null;
  return (
    <section className={`flex flex-col gap-2 rounded-2xl border-2 p-4 ${s.done ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950" : "border-zinc-200 dark:border-zinc-800"}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">🏅 오늘 인증</h2>
        <span className="text-sm">
          {s.done ? <b className="text-emerald-600">완료! ⭐ +1 받았어요 🎉</b> : <span className="text-zinc-500">{CERT_NEED - s.count}개만 더 하면 인증 ⭐!</span>}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {ITEMS.map(([key, label, href]) => {
          const on = s[key] as boolean;
          const pill = (
            <span className={`flex min-h-11 flex-col items-center justify-center rounded-lg text-[11px] ${on ? "bg-emerald-500 font-semibold text-white shadow-[0_0_10px_rgba(16,185,129,0.6)]" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}>
              <span className="text-base leading-none">{on ? "✓" : "·"}</span>
              {label}
            </span>
          );
          return href && !on ? <Link key={key} href={href}>{pill}</Link> : <div key={key}>{pill}</div>;
        })}
      </div>
    </section>
  );
}
