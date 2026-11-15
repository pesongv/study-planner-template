"use client";
import { useState } from "react";
import { addDays, mondayOf, monthOfWeek, progress, weeksOfMonth, type Goal } from "@/lib/goals";
import { Bar, EditButton, EditGoal, GoalForm, SubjectChip, amountLabel, short, type Actions } from "./ui";

const DOW = ["월", "화", "수", "목", "금", "토", "일"];

export function Week({ goals, today, actions }: { goals: Goal[]; today: string; actions: Actions }) {
  const [start, setStart] = useState(mondayOf(today));
  const [editing, setEditing] = useState("");
  const end = addDays(start, 6);
  const ym = monthOfWeek(start);
  const nth = weeksOfMonth(ym).findIndex((w) => w.start === start) + 1;

  const weekGoals = goals.filter((g) => g.level === "week" && g.period_start === start);
  const months = goals.filter((g) => g.level === "month" && g.period_start.startsWith(ym));
  const days = goals.filter((g) => g.level === "day" && start <= g.period_start && g.period_start <= end);

  return (
    <div className="grid gap-5 md:grid-cols-2 md:items-start">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setStart(addDays(start, -7))} className="min-h-11 px-3" aria-label="지난주">◀</button>
          <div className="text-center">
            <div className="font-semibold">{Number(ym.slice(5))}월 {nth}주차</div>
            <div className="text-xs text-zinc-500">{short(start)} ~ {short(end)}</div>
          </div>
          <button onClick={() => setStart(addDays(start, 7))} className="min-h-11 px-3" aria-label="다음 주">▶</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {DOW.map((name, i) => {
            const date = addDays(start, i);
            const list = days.filter((g) => g.period_start === date);
            const done = list.filter((g) => g.status === "done").length;
            return (
              <div key={date} className={`rounded-lg p-1 ${date === today ? "bg-indigo-100 dark:bg-indigo-950" : ""}`}>
                <div className="text-zinc-500">{name}</div>
                <div>{short(date).split("/")[1]}</div>
                <div className="h-4 text-[10px] text-zinc-500">{list.length ? `${done}/${list.length}` : ""}</div>
              </div>
            );
          })}
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">이번 주 목표</h2>
          {!weekGoals.length && <p className="text-sm text-zinc-500">주간 목표가 없어요. 월간 탭에서 월 목표를 주차로 나눌 수도 있어요.</p>}
          {weekGoals.map((g) => editing === g.goal_id ? (
            <EditGoal key={g.goal_id} goal={g} actions={actions} onDone={() => setEditing("")} />
          ) : (
            <div key={g.goal_id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm">{g.title} <span className="text-xs text-zinc-500">{amountLabel(g)}</span></span>
                <SubjectChip subject={g.subject} />
                <EditButton onClick={() => setEditing(g.goal_id)} />
                <button onClick={() => actions.patch(g.goal_id, { status: "deleted" })} className="min-h-11 px-1 text-zinc-400" aria-label="삭제">✕</button>
              </div>
              <Bar value={progress(g, goals)} />
            </div>
          ))}
        </section>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">주간 목표 추가</h2>
        <GoalForm
          placeholder="주간 목표 (예: 영어 단어 1과 외우기)"
          onSubmit={(f) => actions.create({ ...f, level: "week", period_start: start, period_end: end })}
          extra={months.length > 0 && (
            <select name="parent_id" className="input" defaultValue="">
              <option value="">월 목표와 연결 안 함</option>
              {months.map((m) => <option key={m.goal_id} value={m.goal_id}>{m.title}</option>)}
            </select>
          )}
        />
      </section>
    </div>
  );
}
