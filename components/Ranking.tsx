"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Row = { name: string; stars: number; me: boolean };

/** 이번 달 별 상위 5명 */
export function Ranking() {
  const [rows, setRows] = useState<Row[]>();

  useEffect(() => {
    api<Row[]>("/api/ranking").then((r) => Array.isArray(r) && setRows(r));
  }, []);

  if (!rows) return null;
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">🏆 이번 달 별 TOP 5</h2>
      {!rows.length && <p className="text-sm text-zinc-500">아직 별을 받은 친구가 없어요. 첫 번째 주인공이 되어 볼까요? ⭐</p>}
      <ol className="flex flex-col gap-1">
        {rows.map((r, i) => (
          <li key={i} className={`flex items-center gap-3 rounded-lg px-2 py-1 ${r.me ? "bg-indigo-50 font-semibold dark:bg-indigo-950" : ""}`}>
            <span className="w-8 text-center">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
            <span className="flex-1">{r.name}{r.me && " (나)"}</span>
            <b className="text-amber-500">⭐ {r.stars}</b>
          </li>
        ))}
      </ol>
    </section>
  );
}
