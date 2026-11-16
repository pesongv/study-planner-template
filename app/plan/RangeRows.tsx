"use client";
// 시험 범위 입력 줄들 (월 목표 추가, D-day까지 나누기에서 같이 씀)
import { RANGE_NAMES, RANGE_UNITS, type RangeItem } from "@/lib/goals";

export type RangeRow = { name: string; start: string; end: string; unit: string };
export const emptyRow = (): RangeRow => ({ name: "교과서", start: "", end: "", unit: "쪽" });
export const toRows = (items: RangeItem[]): RangeRow[] => items.map((r) => ({ ...r, start: String(r.start), end: String(r.end) }));
/** 다 채운 줄만 → 저장용 */
export const toItems = (rows: RangeRow[]): RangeItem[] =>
  rows.filter((r) => r.start !== "" && r.end !== "").map((r) => ({ ...r, start: Number(r.start), end: Number(r.end) }));

export function RangeRows({ rows, setRows }: { rows: RangeRow[]; setRows: (r: RangeRow[]) => void }) {
  const set = (i: number, patch: Partial<RangeRow>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-1">
          <select value={r.name} aria-label={`범위 ${i + 1} 종류`} className="input w-[4.5rem] shrink-0 px-1"
            onChange={(e) => set(i, { name: e.target.value, unit: e.target.value === "유인물" ? "장" : r.unit === "장" ? "쪽" : r.unit })}>
            {RANGE_NAMES.map((n) => <option key={n}>{n}</option>)}
          </select>
          <input type="number" min={0} value={r.start} onChange={(e) => set(i, { start: e.target.value })} placeholder="시작" aria-label={`범위 ${i + 1} 시작`} className="input min-w-0 px-2" />
          <span>~</span>
          <input type="number" min={0} value={r.end} onChange={(e) => set(i, { end: e.target.value })} placeholder="끝" aria-label={`범위 ${i + 1} 끝`} className="input min-w-0 px-2" />
          <select value={r.unit} onChange={(e) => set(i, { unit: e.target.value })} aria-label={`범위 ${i + 1} 단위`} className="input w-[3.75rem] shrink-0 px-1">
            {RANGE_UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
          {rows.length > 1 && (
            <button type="button" onClick={() => setRows(rows.filter((_, k) => k !== i))} className="min-h-11 shrink-0 px-1 text-zinc-400" aria-label={`범위 ${i + 1} 빼기`}>✕</button>
          )}
        </div>
      ))}
      {rows.length < 10 && (
        <button type="button" onClick={() => setRows([...rows, emptyRow()])} className="min-h-11 rounded-lg border border-dashed text-sm text-zinc-500">
          + 범위 추가 (교과서·문제집·유인물)
        </button>
      )}
    </div>
  );
}
