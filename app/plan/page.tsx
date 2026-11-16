"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { DEFAULT_SUBJECTS, type Goal } from "@/lib/goals";
import { today as kstToday } from "@/lib/time";
import type { Actions } from "./ui";
import { Today } from "./Today";
import { Week } from "./Week";
import { Month } from "./Month";

const TABS = { today: "오늘", week: "주간", month: "월간" } as const;

export default function PlanPage() {
  const [tab, setTab] = useState<keyof typeof TABS>("today");
  const [goals, setGoals] = useState<Goal[]>();
  const [today, setToday] = useState(""); // 렌더 중에 new Date()를 쓰면 안 돼서 불러온 뒤에 정함
  const [cheer, setCheer] = useState(false);

  const reload = useCallback(
    () =>
      api<Goal[]>("/api/goals").then((r) => {
        if (!Array.isArray(r)) return;
        setGoals(r);
        setToday(kstToday());
      }),
    [],
  );
  useEffect(() => {
    reload();
  }, [reload]);

  const actions: Actions = {
    async create(g) {
      const res = await api("/api/goals", g);
      if (!res.error) reload();
      return res.error;
    },
    async patch(id, f) {
      // 화면 먼저 바꾸고(빠르게) 서버 저장
      setGoals((gs) => gs?.map((g) => (g.goal_id === id ? { ...g, ...f } : g)).filter((g) => g.status !== "deleted"));
      if (f.status === "done") {
        setCheer(true);
        setTimeout(() => setCheer(false), 1500);
      }
      const res = await api(`/api/goals/${id}`, f, "PATCH");
      if (res.error) reload();
      return res.error;
    },
  };

  const subjects = [...new Set([...DEFAULT_SUBJECTS, ...(goals ?? []).map((g) => g.subject).filter(Boolean)])];
  const props = { goals: goals ?? [], today, actions, reload };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4 md:max-w-4xl">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold">📅 나의 계획</h1>
        <div className="flex gap-3">
          <Link href="/help" className="inline-flex min-h-11 items-center text-sm text-zinc-500 underline">❓도움말</Link>
          <Link href="/" className="inline-flex min-h-11 items-center text-sm text-zinc-500 underline">독서실로</Link>
        </div>
      </header>

      <nav className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
        {(Object.keys(TABS) as (keyof typeof TABS)[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-h-11 rounded-lg text-sm font-semibold ${tab === t ? "bg-white shadow dark:bg-zinc-700" : "text-zinc-500"}`}
          >
            {TABS[t]}
          </button>
        ))}
      </nav>

      {!goals || !today ? (
        <p className="text-center text-sm text-zinc-500">계획을 불러오는 중이에요…</p>
      ) : tab === "today" ? (
        <Today {...props} />
      ) : tab === "week" ? (
        <Week {...props} />
      ) : (
        <Month {...props} />
      )}

      <datalist id="subjects">
        {subjects.map((s) => <option key={s} value={s} />)}
      </datalist>

      {cheer && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
          <div className="animate-cheer rounded-2xl bg-white/90 px-6 py-4 text-2xl font-bold shadow-lg dark:bg-zinc-800/90">🎉 잘했어요!</div>
        </div>
      )}
    </main>
  );
}
