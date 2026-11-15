"use client";
import { useState } from "react";
import { addDays, lastDayOf, monthOf, progress, weekday, weeksOfMonth, type Goal } from "@/lib/goals";
import { api } from "@/lib/client";
import { Bar, EditButton, EditGoal, GoalForm, SubjectChip, amountLabel, type Actions } from "./ui";
import { SplitDday } from "./SplitDday";

const shiftMonth = (ym: string, n: number) => {
  const [y, m] = ym.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  return t.toISOString().slice(0, 7);
};

export function Month({ goals, today, actions, reload }: { goals: Goal[]; today: string; actions: Actions; reload: () => void }) {
  const [ym, setYm] = useState(monthOf(today));
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState("");
  const [splitting, setSplitting] = useState("");
  const first = ym + "-01";
  const last = lastDayOf(ym);
  const monthGoals = goals.filter((g) => g.level === "month" && g.period_start === first);
  const nWeeks = weeksOfMonth(ym).length;

  // 달력: 1일 앞 빈칸 + 날짜들
  const blanks = weekday(first);
  const dates = Array.from({ length: Number(last.slice(8)) }, (_, i) => addDays(first, i));
  const dot = (date: string) => {
    const list = goals.filter((g) => g.level === "day" && g.period_start === date);
    if (!list.length) return "";
    return list.every((g) => g.status === "done") ? "●" : "○";
  };

  async function split(id: string) {
    const res = await api("/api/goals/split", { month_id: id });
    setMsg(res.error ?? `${nWeeks}주로 나눴어요. 주간 탭에서 확인해 보세요!`);
    if (!res.error) reload();
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 md:items-start">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setYm(shiftMonth(ym, -1))} className="min-h-11 px-3" aria-label="지난달">◀</button>
          <div className="font-semibold">{ym.slice(0, 4)}년 {Number(ym.slice(5))}월</div>
          <button onClick={() => setYm(shiftMonth(ym, 1))} className="min-h-11 px-3" aria-label="다음 달">▶</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => <div key={d} className="text-xs text-zinc-500">{d}</div>)}
          {Array.from({ length: blanks }, (_, i) => <div key={`b${i}`} />)}
          {dates.map((date) => (
            <div key={date} className={`flex h-11 flex-col items-center justify-center rounded-lg ${date === today ? "bg-indigo-100 dark:bg-indigo-950" : ""}`}>
              <span>{Number(date.slice(8))}</span>
              <span className={`h-3 text-[10px] leading-3 ${dot(date) === "●" ? "text-emerald-500" : "text-zinc-400"}`}>{dot(date)}</span>
            </div>
          ))}
        </div>
        <p className="-mt-3 text-xs text-zinc-500">● 그날 할 일 모두 완료 · ○ 아직 남음</p>

        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">이번 달 목표</h2>
          {monthGoals.map((g) => {
            const kids = goals.filter((c) => c.parent_id === g.goal_id);
            const hasWeeks = kids.some((c) => c.level === "week");
            if (editing === g.goal_id) return <EditGoal key={g.goal_id} goal={g} actions={actions} onDone={() => setEditing("")} />;
            return (
              <div key={g.goal_id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm">{g.title} <span className="text-xs text-zinc-500">{amountLabel(g)}</span></span>
                  <SubjectChip subject={g.subject} />
                  <EditButton onClick={() => setEditing(g.goal_id)} />
                  <button onClick={() => actions.patch(g.goal_id, { status: "deleted" })} className="min-h-11 px-1 text-zinc-400" aria-label="삭제">✕</button>
                </div>
                <Bar value={progress(g, goals)} />
                {splitting === g.goal_id ? (
                  <SplitDday goal={g} goals={goals} today={today} onDone={(m) => { setSplitting(""); setMsg(m); if (m) reload(); }} />
                ) : !hasWeeks && (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSplitting(g.goal_id)} className="min-h-11 rounded-lg border border-indigo-400 px-3 text-sm text-indigo-600">
                      📖 {kids.length ? "D-day까지 다시 나누기" : "D-day까지 나누기"}
                    </button>
                    {!kids.length && (
                      <button onClick={() => split(g.goal_id)} className="min-h-11 rounded-lg border px-3 text-sm">이번 달 {nWeeks}주로 나누기</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {msg && <p className="text-sm">{msg}</p>}
        </section>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">월 목표 추가</h2>
        <GoalForm
          placeholder="이번 달 목표 (예: 수학 문제집 1권 끝내기)"
          onSubmit={(f) => actions.create({ ...f, level: "month", period_start: first, period_end: last })}
        />
      </section>
    </div>
  );
}
