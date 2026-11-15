"use client";
import { useState } from "react";
import { addDays, daysBetween, todayShare, type Goal } from "@/lib/goals";
import { CheckButton, EditButton, EditGoal, GoalForm, SubjectChip, amountLabel, short, type Actions } from "./ui";

type Props = { goals: Goal[]; today: string; actions: Actions };

export function Today({ goals, today, actions }: Props) {
  const [editing, setEditing] = useState("");
  const days = goals.filter((g) => g.level === "day");
  const todo = days.filter((g) => g.period_start === today);
  const missed = days.filter((g) => g.period_start < today && g.status !== "done").sort((a, b) => a.period_start.localeCompare(b.period_start));
  const weeks = goals.filter((g) => g.level === "week" && g.period_start <= today && today <= g.period_end);
  const done = todo.filter((g) => g.status === "done").length;

  const toggle = (g: Goal) =>
    actions.patch(g.goal_id, g.status === "done"
      ? { status: "todo" }
      : { status: "done", done_amount: g.target_amount || g.done_amount });
  const moveTo = (g: Goal, date: string) => actions.patch(g.goal_id, { period_start: date, period_end: date });

  return (
    <div className="flex flex-col gap-5">
      <DDay goals={goals} today={today} actions={actions} />

      {/* 넓은 화면: 왼쪽 할 일 / 오른쪽 추가. 폰: 위아래 */}
      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-5">
          {todo.some((g) => g.target_amount) && (
            <section className="rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-950">
              <h2 className="mb-2 font-semibold">📖 오늘 볼 분량</h2>
              <ul className="flex flex-col gap-1">
                {todo.filter((g) => g.target_amount).map((g) => (
                  <li key={g.goal_id} className={`flex items-baseline gap-2 text-lg ${g.status === "done" ? "text-zinc-400 line-through" : ""}`}>
                    <span className="flex-1 font-semibold">{g.title}</span>
                    <span className="text-sm text-zinc-500">{g.status === "done" ? "✅" : amountLabel(g)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-2">
            <h2 className="font-semibold">
              오늘 할 일 <span className="text-sm font-normal text-zinc-500">{todo.length ? `${done}/${todo.length} 완료` : ""}</span>
            </h2>
            {!todo.length && <p className="text-sm text-zinc-500">아직 오늘 할 일이 없어요. 하나만 정해 볼까요?</p>}
            <ul className="flex flex-col gap-1">
              {todo.map((g) => editing === g.goal_id ? (
                <li key={g.goal_id}><EditGoal goal={g} actions={actions} onDone={() => setEditing("")} /></li>
              ) : (
                <li key={g.goal_id} className="flex min-h-11 items-center gap-2 rounded-lg px-1">
                  <CheckButton done={g.status === "done"} onClick={() => toggle(g)} label={g.title} />
                  <span className={`flex-1 ${g.status === "done" ? "text-zinc-400 line-through" : ""}`}>
                    {g.title}
                    {g.target_amount && (
                      <span className="ml-1.5 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        📖 {amountLabel(g)}
                      </span>
                    )}
                  </span>
                  <SubjectChip subject={g.subject} />
                  {g.status !== "done" && (
                    <button onClick={() => moveTo(g, addDays(today, 1))} className="min-h-11 px-1 text-xs text-zinc-500 underline">내일로</button>
                  )}
                  <EditButton onClick={() => setEditing(g.goal_id)} />
                  <button onClick={() => actions.patch(g.goal_id, { status: "deleted" })} className="min-h-11 px-1 text-zinc-400" aria-label="삭제">✕</button>
                </li>
              ))}
            </ul>
          </section>

          {missed.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-semibold">못 끝낸 일 <span className="text-sm font-normal text-zinc-500">괜찮아요, 오늘 다시 해 봐요</span></h2>
              {missed.map((g) => (
                <div key={g.goal_id} className="flex min-h-11 items-center gap-2 text-sm">
                  <span className="w-10 text-xs text-zinc-500">{short(g.period_start)}</span>
                  <span className="flex-1">{g.title}</span>
                  <button onClick={() => moveTo(g, today)} className="min-h-11 rounded-lg border px-3">오늘로</button>
                  <button onClick={() => actions.patch(g.goal_id, { status: "deleted" })} className="min-h-11 px-1 text-zinc-400" aria-label="삭제">✕</button>
                </div>
              ))}
            </section>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h2 className="font-semibold">할 일 추가</h2>
            <GoalForm
              placeholder="오늘 할 일 (예: 영어 단어 30개 외우기)"
              onSubmit={(f) => actions.create({ ...f, level: "day", period_start: today, period_end: today })}
              extra={weeks.length > 0 && (
                <select name="parent_id" className="input" defaultValue="">
                  <option value="">주간 목표와 연결 안 함</option>
                  {weeks.map((w) => <option key={w.goal_id} value={w.goal_id}>{w.title}</option>)}
                </select>
              )}
            />
          </section>

          {weeks.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-semibold">이번 주 목표에서 가져오기</h2>
              {weeks.map((w) => (
                <div key={w.goal_id} className="flex min-h-11 items-center gap-2">
                  <span className="flex-1 text-sm">
                    {w.title}
                    {todayShare(w, goals, today) > 0 && <span className="ml-1 text-xs text-zinc-500">오늘 몫 {todayShare(w, goals, today)}{w.unit}</span>}
                  </span>
                  <button
                    onClick={() => {
                      const share = todayShare(w, goals, today);
                      actions.create({
                        level: "day", parent_id: w.goal_id, title: w.title, subject: w.subject, period_start: today, period_end: today,
                        target_amount: share ? String(share) : "", unit: share ? w.unit : "",
                      });
                    }}
                    className="min-h-11 rounded-lg border px-3 text-sm"
                  >
                    오늘 할 일로
                  </button>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function DDay({ goals, today, actions }: Props) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const ddays = goals.filter((g) => g.level === "dday" && g.period_end >= today).sort((a, b) => a.period_end.localeCompare(b.period_end));

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const date = String(f.get("date"));
    const err = await actions.create({ level: "dday", title: String(f.get("title")), period_start: date, period_end: date });
    setError(err ?? "");
    if (!err) setAdding(false);
  }

  return (
    <section className="flex flex-wrap items-center gap-2">
      {ddays.map((g) => {
        const n = daysBetween(today, g.period_end);
        return (
          <span key={g.goal_id} className="flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            <b>{n === 0 ? "D-Day" : `D-${n}`}</b> {g.title}
            <button onClick={() => actions.patch(g.goal_id, { status: "deleted" })} className="ml-1 text-rose-400" aria-label={`${g.title} D-day 삭제`}>✕</button>
          </span>
        );
      })}
      {adding ? (
        <form onSubmit={add} className="flex w-full flex-col gap-2">
          <div className="flex gap-2">
            <input name="title" placeholder="시험 이름 (예: 기말고사)" required maxLength={60} className="input" />
            <input name="date" type="date" min={today} required className="input w-40 shrink-0" />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <button className="btn flex-1">D-day 추가</button>
            <button type="button" onClick={() => setAdding(false)} className="min-h-11 px-3 text-sm text-zinc-500">취소</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="min-h-11 rounded-full border border-dashed px-3 text-sm text-zinc-500">+ D-day</button>
      )}
    </section>
  );
}
