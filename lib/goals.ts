// 월/주/일 계획 계산. 순수 함수만 (서버·브라우저 공용) — scripts/check.ts 에서 테스트
import type { Row } from "./schema";

export type Goal = Row<"목표">;
export const DEFAULT_SUBJECTS = ["국어", "영어", "수학", "과학", "사회", "역사"];

// ── 날짜 ("YYYY-MM-DD" 문자열끼리 계산, 시간대 영향 없게 UTC로) ──
const d = (s: string) => new Date(s + "T00:00:00Z");
const fmt = (x: Date) => x.toISOString().slice(0, 10);
export const addDays = (s: string, n: number) => fmt(new Date(d(s).getTime() + n * 86_400_000));
export const weekday = (s: string) => d(s).getUTCDay(); // 0=일
export const mondayOf = (s: string) => addDays(s, -((weekday(s) + 6) % 7));
export const monthOf = (s: string) => s.slice(0, 7); // "YYYY-MM"
export const lastDayOf = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return fmt(new Date(Date.UTC(y, m, 0)));
};
export const daysBetween = (a: string, b: string) => Math.round((d(b).getTime() - d(a).getTime()) / 86_400_000);

/** 그 달의 주차들 (월~일). 목요일이 그 달에 있는 주만. */
export function weeksOfMonth(ym: string) {
  const weeks: { start: string; end: string }[] = [];
  for (let mon = mondayOf(ym + "-01"); ; mon = addDays(mon, 7)) {
    const thu = addDays(mon, 3);
    if (monthOf(thu) > ym) break;
    if (monthOf(thu) === ym) weeks.push({ start: mon, end: addDays(mon, 6) });
  }
  return weeks;
}

/** 이 주(월요일)가 속한 달 = 목요일의 달 */
export const monthOfWeek = (monday: string) => monthOf(addDays(monday, 3));

// ── 목표 ──
/** 시트 줄(append 기록) → 목표별 최신 상태. 삭제된 것 제외. */
export function latestGoals(rows: Goal[]) {
  const map = new Map<string, Goal>();
  for (const r of rows) map.set(r.goal_id, r);
  return [...map.values()].filter((g) => g.status !== "deleted");
}

/** 진행률 0~1. 하위 목표가 있으면 하위 평균, 없으면 자기 상태/달성량. */
export function progress(goal: Goal, all: Goal[]): number {
  const kids = all.filter((g) => g.parent_id === goal.goal_id);
  if (kids.length) return kids.reduce((sum, k) => sum + progress(k, all), 0) / kids.length;
  if (goal.status === "done") return 1;
  const target = Number(goal.target_amount);
  return target > 0 ? Math.min(1, Number(goal.done_amount || 0) / target) : 0;
}

/** 시험 범위 한 줄: 교과서 13~20쪽, 유인물 1~5장 … (유인물 1장 = 1쪽과 같은 분량으로 셈) */
export type RangeItem = { name: string; start: number; end: number; unit: string };
export const RANGE_NAMES = ["교과서", "문제집", "유인물", "기타"];
export const RANGE_UNITS = ["쪽", "장", "문제"];

/** 월 목표에 저장된 범위 (없거나 깨졌으면 빈 배열) */
export function parseRanges(json: string): RangeItem[] {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * 범위들을 시험 전날까지 공부하는 날에 고르게 나눔.
 * 쉬는 요일(0=일~6=토)과 시험 직전 복습일은 뺌. 분량이 날보다 적으면 앞쪽 날에만 배정.
 * 결과의 segs는 그날 볼 조각들 (i = 몇 번째 범위인지, 범위 경계를 넘으면 두 조각).
 */
export function splitRanges(o: { ranges: RangeItem[]; from: string; examDate: string; restDays: number[]; reviewDays: number }) {
  const last = addDays(o.examDate, -1 - o.reviewDays);
  const days: string[] = [];
  for (let day = o.from; day <= last; day = addDays(day, 1)) if (!o.restDays.includes(weekday(day))) days.push(day);
  // ponytail: 쪽을 하나씩 펼쳐서 나눔. 범위 합이 수천 쪽이어도 충분히 빠름
  const pages = o.ranges.flatMap((r, i) => Array.from({ length: Math.max(0, r.end - r.start + 1) }, (_, k) => ({ i, p: r.start + k })));
  if (!pages.length || !days.length) return [];
  const used = days.slice(0, Math.min(days.length, pages.length));
  let at = 0;
  return used.map((date, d) => {
    const n = Math.floor(pages.length / used.length) + (d < pages.length % used.length ? 1 : 0);
    const segs: { i: number; s: number; e: number }[] = [];
    for (const { i, p } of pages.slice(at, (at += n))) {
      const last = segs.at(-1);
      if (last && last.i === i && last.e === p - 1) last.e = p;
      else segs.push({ i, s: p, e: p });
    }
    return { date, count: n, segs };
  });
}

/** 하루 조각 → "교과서 19~20, 30쪽, 유인물 1장" (같은 이름·단위는 묶음) */
export function rangeLabel(segs: { i: number; s: number; e: number }[], items: RangeItem[]) {
  const groups: { name: string; unit: string; pieces: string[] }[] = [];
  for (const { i, s, e } of segs) {
    const { name, unit } = items[i];
    const piece = s === e ? `${s}` : `${s}~${e}`;
    const g = groups.at(-1);
    if (g && g.name === name && g.unit === unit) g.pieces.push(piece);
    else groups.push({ name, unit, pieces: [piece] });
  }
  return groups.map((g) => `${g.name && g.name !== "기타" ? g.name + " " : ""}${g.pieces.join(", ")}${g.unit}`).join(", ");
}

/** 범위 전체 요약 (월 목표 옆 표시용) */
export const rangesSummary = (items: RangeItem[]) =>
  rangeLabel(items.map((r, i) => ({ i, s: r.start, e: r.end })), items);

/** 주간 목표에서 오늘 할 몫 = (목표량 − 이미 끝낸 하루 분량) ÷ 이번 주 남은 날(오늘 포함). 목표량 없으면 0 */
export function todayShare(week: Goal, all: Goal[], today: string) {
  const target = Number(week.target_amount) || 0;
  const done = all
    .filter((g) => g.parent_id === week.goal_id && g.status === "done")
    .reduce((sum, g) => sum + (Number(g.target_amount) || 0), 0);
  const remaining = target - done;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / Math.max(1, daysBetween(today, week.period_end) + 1));
}

/** 주간 목표 이름: "수학 범위 (11월 2주차)" — 그 주 목요일이 속한 달 기준 */
export function weekTitle(title: string, monday: string) {
  const ym = monthOfWeek(monday);
  return `${title} (${Number(ym.slice(5))}월 ${weeksOfMonth(ym).findIndex((w) => w.start === monday) + 1}주차)`;
}

/** 월 목표 → 주차 목표 나누기. 목표량은 고르게 (나머지는 앞 주부터 1씩). */
export function splitMonth(month: Goal) {
  const weeks = weeksOfMonth(monthOf(month.period_start));
  const total = Number(month.target_amount) || 0;
  return weeks.map((w, i) => {
    const amount = total ? Math.floor(total / weeks.length) + (i < total % weeks.length ? 1 : 0) : 0;
    return {
      level: "week" as const,
      parent_id: month.goal_id,
      period_start: w.start,
      period_end: w.end,
      title: weekTitle(month.title, w.start),
      subject: month.subject,
      target_amount: amount ? String(amount) : "",
      unit: month.unit,
    };
  });
}
