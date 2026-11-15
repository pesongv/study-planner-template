"use client";
// 계획 화면 공용 조각
import { useState } from "react";
import type { Goal } from "@/lib/goals";

const UNITS = ["쪽", "문제", "개", "강", "분", "번"];

export type NewGoal = Partial<Goal> & Pick<Goal, "level" | "period_start" | "period_end" | "title">;
export type Actions = {
  create: (g: NewGoal) => Promise<string | undefined>; // 실패 시 에러 문구
  patch: (id: string, f: Partial<Goal>) => Promise<string | undefined>;
};

export function Bar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right text-xs text-zinc-500">{pct}%</span>
    </div>
  );
}

export function SubjectChip({ subject }: { subject: string }) {
  return subject ? <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[11px] text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{subject}</span> : null;
}

/** 제목/과목/목표량 입력 폼. extra로 상위 목표 선택 등을 붙임 */
export function GoalForm({
  placeholder, submitLabel = "추가", onSubmit, extra, initial, onCancel,
}: {
  placeholder: string;
  submitLabel?: string;
  onSubmit: (f: { title: string; subject: string; target_amount: string; unit: string; parent_id: string }) => Promise<string | undefined>;
  extra?: React.ReactNode;
  initial?: Goal; // 있으면 수정 폼
  onCancel?: () => void;
}) {
  const units = initial?.unit && !UNITS.includes(initial.unit) ? [initial.unit, ...UNITS] : UNITS;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setBusy(true);
    const amount = f.target_amount ?? "";
    const err = await onSubmit({
      title: f.title ?? "", subject: f.subject ?? "", target_amount: amount, unit: amount ? f.unit ?? "" : "", parent_id: f.parent_id ?? "",
    });
    setBusy(false);
    setError(err ?? "");
    if (!err) form.reset();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
      <input name="title" placeholder={placeholder} defaultValue={initial?.title} required maxLength={60} className="input" />
      <input name="subject" placeholder="과목 (예: 수학)" defaultValue={initial?.subject} list="subjects" maxLength={20} className="input" />
      <label className="flex items-center gap-2 text-sm">
        <span className="shrink-0 text-zinc-500">얼마나?</span>
        <input name="target_amount" type="number" min={1} max={999999} placeholder="예: 40" defaultValue={initial?.target_amount} className="input" />
        <select name="unit" defaultValue={initial?.unit || "쪽"} aria-label="세는 말" className="input w-24 shrink-0">
          {units.map((u) => <option key={u}>{u}</option>)}
        </select>
      </label>
      <p className="-mt-1 text-xs text-zinc-500">안 써도 괜찮아요</p>
      {extra}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className="btn flex-1">{busy ? "저장 중…" : submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} className="min-h-11 px-3 text-sm text-zinc-500">취소</button>}
      </div>
    </form>
  );
}

/** 목표 수정 폼 (제목/과목/목표량) */
export function EditGoal({ goal, actions, onDone }: { goal: Goal; actions: Actions; onDone: () => void }) {
  return (
    <GoalForm
      placeholder="제목"
      submitLabel="저장"
      initial={goal}
      onCancel={onDone}
      onSubmit={async ({ title, subject, target_amount, unit }) => {
        const err = await actions.patch(goal.goal_id, { title, subject, target_amount, unit });
        if (!err) onDone();
        return err;
      }}
    />
  );
}

export function EditButton({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="min-h-11 px-1 text-zinc-400" aria-label="수정">✏️</button>;
}

export const amountLabel = (g: Goal) => (g.target_amount ? `${g.target_amount}${g.unit}` : "");
export const short = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

/** 할 일 완료 버튼: 안 했으면 흐린 ✓, 누르면 초록 불이 들어옴 */
export function CheckButton({ done, onClick, label }: { done: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={done}
      aria-label={`${label} ${done ? "완료 취소" : "완료"}`}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-xl font-bold transition ${
        done
          ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.8)]"
          : "border-zinc-300 text-zinc-300 hover:border-emerald-400 hover:text-emerald-400 dark:border-zinc-600 dark:text-zinc-600"
      }`}
    >
      ✓
    </button>
  );
}
