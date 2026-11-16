"use client";
import { useState } from "react";
import { parseRanges, splitRanges, type Goal } from "@/lib/goals";
import { RangeRows, toItems, toRows, type RangeRow } from "./RangeRows";
import { api } from "@/lib/client";
import { short } from "./ui";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

/** 시험 범위를 D-day(과목별 시험 날) 전날까지 하루 할 일로 나누는 폼 */
export function SplitDday({ goal, goals, today, onDone }: { goal: Goal; goals: Goal[]; today: string; onDone: (msg: string) => void }) {
  const firstDday = goals.filter((g) => g.level === "dday" && g.period_end > today).sort((a, b) => a.period_end.localeCompare(b.period_end))[0];
  // 월 목표에 저장된 범위가 있으면 그대로, 없으면 1~목표량
  const [rows, setRows] = useState<RangeRow[]>(() => {
    const saved = parseRanges(goal.ranges_json);
    return saved.length ? toRows(saved) : [{ name: "교과서", start: "1", end: goal.target_amount, unit: goal.unit || "쪽" }];
  });
  const [exam, setExam] = useState(firstDday?.period_end ?? "");
  const [rest, setRest] = useState<number[]>([]);
  const [review, setReview] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);


  const ranges = toItems(rows);
  const units = [...new Set(ranges.map((r) => r.unit))];
  const unit = units.length > 1 ? "(쪽·장)" : units[0] ?? "쪽";
  const parts = exam && ranges.length
    ? splitRanges({ ranges, from: today, examDate: exam, restDays: rest, reviewDays: review })
    : [];
  const total = parts.reduce((sum, p) => sum + p.count, 0);
  const perDay = parts.length ? Math.ceil(total / parts.length) : 0;

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
      <div className="flex flex-col gap-1">
        <span className="text-zinc-500">시험 범위 <span className="text-xs">(유인물은 1~5장처럼)</span></span>
        <RangeRows rows={rows} setRows={setRows} />
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
