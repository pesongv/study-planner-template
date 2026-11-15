"use client";
// 공부 타이머. 시간은 "시작 시각"으로 계산 (탭을 닫았다 와도 맞음). 화면을 처음 그린 뒤에만 쓰이는 컴포넌트라 localStorage를 바로 읽음
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { METHODS, REST_TIPS, STAR_MINUTES, starsFor, type Method } from "@/lib/study";
import { today as kstToday } from "@/lib/time";
import type { Goal } from "@/lib/goals";

type Saved = { token: string; start: number; method: Method; goal_id: string; title: string };
type Summary = { todayMinutes: number; todayStars: number; monthStars: number };
type Phase = { kind: "idle" } | { kind: "focus"; t: Saved } | { kind: "rest"; until: number; tip: string; minutes: number; stars: number; goal?: { id: string; title: string } };

const KEY = "sp_timer";
const load = (): Saved | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
};
const save = (t: Saved | null) => {
  try {
    if (t) localStorage.setItem(KEY, JSON.stringify(t));
    else localStorage.removeItem(KEY);
  } catch {}
};
const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

export function Timer({ onFinish }: { onFinish?: () => void }) {
  const [phase, setPhase] = useState<Phase>(() => {
    const t = load();
    return t ? { kind: "focus", t } : { kind: "idle" };
  });
  const [method, setMethod] = useState<Method>("pomodoro");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalId, setGoalId] = useState("");
  const [summary, setSummary] = useState<Summary>();
  const [clock, setClock] = useState(() => Date.now());
  const [confirmStop, setConfirmStop] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = useCallback(() => {
    api<Summary>("/api/study-logs").then((s) => !s.error && setSummary(s));
    api<Goal[]>("/api/goals").then((gs) => {
      if (!Array.isArray(gs)) return;
      const t = kstToday();
      setGoals(gs.filter((g) => g.level === "day" && g.period_start === t && g.status !== "done"));
    });
  }, []);


  async function start() {
    setMsg("");
    const res = await api<{ token: string }>("/api/timer/start", { method, goal_id: goalId });
    if (res.error) return setMsg(res.error);
    const t: Saved = { token: res.token, start: Date.now(), method, goal_id: goalId, title: goals.find((g) => g.goal_id === goalId)?.title ?? "" };
    save(t);
    setClock(Date.now());
    setPhase({ kind: "focus", t });
  }

  const finish = useCallback(async (t: Saved) => {
    save(null); // 먼저 지워서 매초 확인에서 두 번 끝내지 않게
    const res = await api<{ minutes: number; stars: number }>("/api/timer/finish", { token: t.token });
    setConfirmStop(false);
    if (res.error || !res.minutes) {
      setPhase({ kind: "idle" });
      return setMsg(res.error ?? "1분이 안 돼서 기록하지 않았어요. 다시 시작해 볼까요?");
    }
    const rest = METHODS[t.method].rest;
    setPhase({
      kind: "rest", until: Date.now() + rest * 60_000, tip: REST_TIPS[Math.floor(Math.random() * REST_TIPS.length)],
      minutes: res.minutes, stars: res.stars, goal: t.goal_id ? { id: t.goal_id, title: t.title } : undefined,
    });
    refresh();
    onFinish?.();
  }, [refresh, onFinish]);

  useEffect(() => {
    refresh();
    const iv = setInterval(() => {
      setClock(Date.now());
      // 정해진 시간이 다 되면 자동으로 끝내기
      const t = load();
      if (t && METHODS[t.method].focus && Date.now() - t.start >= METHODS[t.method].focus * 60_000) finish(t);
    }, 1000);
    return () => clearInterval(iv);
  }, [refresh, finish]);

  const focus = phase.kind === "focus" ? phase.t : null;
  const elapsed = focus ? Math.max(0, (clock - focus.start) / 1000) : 0;
  const total = focus ? METHODS[focus.method].focus * 60 : 0;

  async function markDone(id: string) {
    const res = await api(`/api/goals/${id}`, { status: "done" }, "PATCH");
    setMsg(res.error ?? "할 일을 완료로 체크했어요 ✓");
    if (phase.kind === "rest") setPhase({ ...phase, goal: undefined });
    refresh();
    onFinish?.();
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">⏱️ 공부 타이머</h2>
        {summary && (
          <span className="text-sm text-zinc-500">
            오늘 {summary.todayMinutes}분 · <b className="text-amber-500">⭐ {summary.monthStars}</b> <span className="text-xs">이번 달</span>
          </span>
        )}
      </div>

      {phase.kind === "idle" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(METHODS) as Method[]).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                aria-pressed={method === m}
                className={`min-h-11 rounded-lg border-2 px-1 text-sm ${method === m ? "border-indigo-600 bg-indigo-50 font-semibold dark:bg-indigo-950" : "border-zinc-200 dark:border-zinc-700"}`}
              >
                {METHODS[m].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            {method === "free" ? `원하는 만큼 공부하고 끝내기를 눌러요. ${STAR_MINUTES}분마다 ⭐` : `${METHODS[method].focus}분 집중하면 ⭐ ${starsFor(METHODS[method].focus)}개!`}
          </p>
          {goals.length > 0 && (
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className="input" aria-label="공부할 할 일">
              <option value="">어떤 공부를 할까요? (안 골라도 돼요)</option>
              {goals.map((g) => <option key={g.goal_id} value={g.goal_id}>{g.title}</option>)}
            </select>
          )}
          <button onClick={start} className="btn text-lg">시작!</button>
        </>
      )}

      {focus && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-sm text-zinc-500">{METHODS[focus.method].label}{focus.title && ` · ${focus.title}`}</div>
          <div className="font-mono text-5xl font-bold tabular-nums">{mmss(total ? Math.max(0, total - elapsed) : elapsed)}</div>
          {total > 0 ? (
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }} />
            </div>
          ) : (
            <div className="text-sm">
              ⭐ {starsFor(elapsed / 60)}개 · 다음 별까지 {mmss(STAR_MINUTES * 60 - (elapsed % (STAR_MINUTES * 60)))}
            </div>
          )}
          {focus.method === "free" ? (
            <button onClick={() => finish(focus)} className="btn w-full">끝내기</button>
          ) : confirmStop ? (
            <div className="flex w-full flex-col gap-2 text-center text-sm">
              <p>{METHODS[focus.method].focus}분을 채우면 ⭐를 받아요. 정말 그만할까요?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmStop(false)} className="btn flex-1">계속할래요</button>
                <button onClick={() => finish(focus)} className="min-h-11 flex-1 rounded-lg border">그만하기</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmStop(true)} className="min-h-11 w-full rounded-lg border text-sm text-zinc-500">그만하기</button>
          )}
        </div>
      )}

      {phase.kind === "rest" && (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-xl font-bold">
            {phase.stars > 0 ? `🎉 ⭐ +${phase.stars}!` : "수고했어요!"} <span className="text-base font-normal">{phase.minutes}분 공부했어요</span>
          </div>
          {phase.goal && (
            <button onClick={() => markDone(phase.goal!.id)} className="min-h-11 w-full rounded-lg border-2 border-emerald-500 text-emerald-600">
              ✓ &lsquo;{phase.goal.title}&rsquo; 다 했어요
            </button>
          )}
          {phase.until > clock ? (
            <>
              <div className="text-sm text-zinc-500">쉬는 시간 {mmss((phase.until - clock) / 1000)}</div>
              <div className="rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950">{phase.tip}</div>
              <button onClick={() => setPhase({ kind: "idle" })} className="text-sm text-zinc-500 underline">쉬는 시간 건너뛰기</button>
            </>
          ) : (
            <button onClick={() => setPhase({ kind: "idle" })} className="btn w-full">한 번 더 할까요?</button>
          )}
        </div>
      )}

      {msg && <p className="text-center text-sm">{msg}</p>}
    </section>
  );
}
