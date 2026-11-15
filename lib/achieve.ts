// 성취감: 연속 인증(스트릭), 뱃지, 지난주 비교, 설정(응원 메시지·학급 목표). 순수 함수만 — scripts/check.ts 에서 테스트
import type { Row } from "./schema";
import { addDays, mondayOf } from "./goals.ts";

/** 인증한 날들 → 지금 연속 일수(오늘 아직 안 했으면 어제까지 이어진 것도 인정)와 최고 기록 */
export function streaks(days: string[], today: string) {
  const set = new Set(days);
  let current = 0;
  for (let d = set.has(today) ? today : addDays(today, -1); set.has(d); d = addDays(d, -1)) current++;
  let max = 0;
  for (const d of set) {
    if (set.has(addDays(d, -1))) continue; // 연속의 시작점에서만 셈
    let n = 0;
    for (let x = d; set.has(x); x = addDays(x, 1)) n++;
    max = Math.max(max, n);
  }
  return { current, max };
}

/** 한 주(월~일)에 가장 많이 인증한 날 수 */
export function bestWeek(days: string[]) {
  const per = new Map<string, number>();
  for (const d of new Set(days)) per.set(mondayOf(d), (per.get(mondayOf(d)) ?? 0) + 1);
  return Math.max(0, ...per.values());
}

/** 이번 주(월~오늘) 공부 분 vs 지난주 같은 요일까지 */
export function weekCompare(logs: Row<"공부기록">[], today: string) {
  const mon = mondayOf(today);
  const sum = (from: string, to: string) =>
    logs.filter((l) => from <= l.date && l.date <= to).reduce((s, l) => s + (Number(l.minutes) || 0), 0);
  const thisWeek = sum(mon, today);
  const lastWeek = sum(addDays(mon, -7), addDays(today, -7));
  return { thisWeek, lastWeek, diff: thisWeek - lastWeek };
}

export type Stats = { checkins: number; certDays: number; maxStreak: number; bestWeek: number; totalMinutes: number; quizCorrect: number; totalStars: number };

export const BADGES: { id: string; emoji: string; name: string; desc: string; earned: (s: Stats) => boolean }[] = [
  { id: "first_seat", emoji: "🪑", name: "첫 입실", desc: "독서실에 처음 앉기", earned: (s) => s.checkins >= 1 },
  { id: "first_cert", emoji: "🏅", name: "첫 인증", desc: "오늘 인증 처음 완료", earned: (s) => s.certDays >= 1 },
  { id: "streak3", emoji: "🔥", name: "3일 연속", desc: "3일 연속 인증", earned: (s) => s.maxStreak >= 3 },
  { id: "week5", emoji: "📅", name: "한 주 완주", desc: "한 주에 5일 인증", earned: (s) => s.bestWeek >= 5 },
  { id: "min100", emoji: "⏱️", name: "100분 달성", desc: "타이머로 총 100분", earned: (s) => s.totalMinutes >= 100 },
  { id: "quiz10", emoji: "🧠", name: "퀴즈 박사", desc: "퀴즈 10개 정답", earned: (s) => s.quizCorrect >= 10 },
  { id: "streak7", emoji: "🌈", name: "7일 연속", desc: "일주일 내내 인증", earned: (s) => s.maxStreak >= 7 },
  { id: "stars50", emoji: "🌟", name: "별 부자", desc: "별 50개 모으기", earned: (s) => s.totalStars >= 50 },
];

export const badgesFor = (s: Stats) => BADGES.map(({ earned, ...b }) => ({ ...b, earned: earned(s) }));

/** 설정 탭(key, value) — 같은 key는 마지막 줄이 현재 값 */
export function latestSettings(rows: Row<"설정">[]) {
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;
  return m;
}
