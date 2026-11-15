"use client";
import { useState } from "react";
import { splitRanges, type Goal, type Range } from "@/lib/goals";
import { api } from "@/lib/client";
import { short } from "./ui";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

/** 시험 범위를 D-day(과목별 시험 날) 전날까지 하루 할 일로 나누는 폼 */
export function SplitDday({ goal, goals, today, onDone }: { goal: Goal; goals: Goal[]; today: string; onDone: (msg: string) => void }) {
  const firstDday = goals.filter((g) => g.level === "dday" && g.period_end > today).sort((a, b) => a.period_end.localeCompare(b.period_end))[0];
  const [rows, setRows] = useState<[string, string][]>([["1", goal.target_amount]]); // 입력 중이라 문자열
  const [exam, setExam] = useState(firstDday?.period_end ?? "");
  const [rest, setRest] = useState<number[]>([]);
  const [review, setReview] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const unit = goal.unit || "쪽";

  const ranges: Range[] = rows.filter(([a, b]) => a && b).map(([a, b]) => [Number(a), Number(b)]);
  const parts = exam && ranges.length
    ? splitRanges({ ranges, from: today, examDate: exam, restDays: rest, reviewDays: review })
    : [];
  const total = parts.reduce((sum, p) => sum + p.count, 0);
  const perDay = parts.length ? Math.ceil(total / parts.length) : 0;
  const setRow = (i: number, j: 0 | 1, v: string) => setRows(rows.map((r, k) => (k === i ? (j ? [r[0], v] : [v, r[1]]) : r)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await api<Goal[]>("/api/goals/split-range", {
      goal_id: goal.goal_id, ranges, exam_date: exam, rest_days: rest, review_days: review,
    });
    setBusy(false);
    if (res.error) return setError(res.error);
    onDone(`${parts.length}일로 나눴어요. 오늘 탭에서 확인해 보세요!`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border-2 border-indigo-300 p-3 text-sm dark:border-indigo-800">
      <div className="flex flex-col gap-2">
        <span className="text-zinc-500">시험 범위 <span className="text-xs">(여러 군데면 + 눌러서 추가)</span></span>
        {rows.map(([a, b], i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="number" min={0} value={a} onChange={(e) => setRow(i, 0, e.target.value)} required className="input" aria-label={`범위 ${i + 1} 시작`} />
            <span>~</span>
            <input type="number" min={0} value={b} onChange={(e) => setRow(i, 1, e.target.value)} required className="input" aria-label={`범위 ${i + 1} 끝`} />
            <span className="shrink-0">{unit}</span>
            {rows.length > 1 && (
              <button type="button" onClick={() => setRows(rows.filter((_, k) => k !== i))} className="min-h-11 px-1 text-zinc-400" aria-label={`범위 ${i + 1} 빼기`}>✕</button>
            )}
          </div>
        ))}
        {rows.length < 10 && (
          <button type="button" onClick={() => setRows([...rows, ["", ""]])} className="min-h-11 rounded-lg border border-dashed text-zinc-500">+ 범위 추가</button>
        )}
      </div>

      <label className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-zinc-500">시험 날</span>
        <input type="date" min={today} value={exam} onChange={(e) => setExam(e.target.value)} required className="input" />
      </label>
      {firstDday && <p className="-mt-2 text-xs text-zinc-500">D-day({firstDday.title})로 채워 뒀어요. 이 과목 시험이 다른 날이면 바꿔 주세요.</p>}

      <div className="flex flex-col gap-1">
        <span className="text-zinc-500">쉬는 요일</span>
        <div className="flex gap-1">
          {DOW.map((d, i) => (
            <button
              key={d}
              type="button"
              aria-pressed={rest.includes(i)}
              onClick={() => setRest(rest.includes(i) ? rest.filter((x) => x !== i) : [...rest, i])}
              className={`min-h-11 flex-1 rounded-lg border ${rest.includes(i) ? "border-rose-400 bg-rose-50 text-rose-600 dark:bg-rose-950" : ""}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-zinc-500">복습일</span>
        <select value={review} onChange={(e) => setReview(Number(e.target.value))} className="input">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n ? `시험 전 ${n}일은 복습` : "복습일 없음"}</option>)}
        </select>
      </label>

      <p className="rounded-lg bg-indigo-50 p-2 text-center dark:bg-indigo-950">
        {parts.length
          ? <>📖 총 {total}{unit} · {short(parts[0].date)}~{short(parts.at(-1)!.date)} · <b>{parts.length}일</b> · 하루 약 <b>{perDay}{unit}</b></>
          : "범위와 시험 날을 넣으면 하루 분량이 보여요"}
      </p>

      {error && <p className="text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button disabled={busy || !parts.length} className="btn flex-1">{busy ? "나누는 중…" : "이대로 나누기"}</button>
        <button type="button" onClick={() => onDone("")} className="min-h-11 px-3 text-zinc-500">취소</button>
      </div>
    </form>
  );
}
