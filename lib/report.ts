// 주간 리포트 계산, CSV 만들기. 순수 함수만 — scripts/check.ts 에서 테스트
import type { Row } from "./schema";
import { addDays, type Goal } from "./goals.ts";

/** 한 주(월요일부터 7일): 날짜별 분, 과목별 분, 하루 할 일 달성, 인증한 날 수 */
export function weekReport(o: { monday: string; logs: Row<"공부기록">[]; goals: Goal[]; certDays: string[] }) {
  const dates = Array.from({ length: 7 }, (_, i) => addDays(o.monday, i));
  const inWeek = (d: string) => o.monday <= d && d <= dates[6];
  const logs = o.logs.filter((l) => inWeek(l.date));
  const subjectOf = new Map(o.goals.map((g) => [g.goal_id, g.subject]));
  const bySubject = new Map<string, number>();
  for (const l of logs) {
    const subject = l.subject || subjectOf.get(l.goal_id) || "기타";
    bySubject.set(subject, (bySubject.get(subject) ?? 0) + (Number(l.minutes) || 0));
  }
  const dayGoals = o.goals.filter((g) => g.level === "day" && inWeek(g.period_start));
  return {
    days: dates.map((date) => ({ date, minutes: logs.filter((l) => l.date === date).reduce((s, l) => s + (Number(l.minutes) || 0), 0) })),
    subjects: [...bySubject].map(([subject, minutes]) => ({ subject, minutes })).sort((a, b) => b.minutes - a.minutes),
    goals: { done: dayGoals.filter((g) => g.status === "done").length, total: dayGoals.length },
    certDays: o.certDays.filter(inWeek).length,
  };
}

/** 주간 회고: 회고 탭에서 date=그 주 월요일, week_review가 있는 마지막 줄 */
export const weekReviewOf = (rows: Row<"회고">[], sid: string, monday: string) =>
  rows.filter((r) => r.student_id === sid && r.date === monday && r.week_review).at(-1)?.week_review ?? "";

/** 엑셀용 CSV (BOM 포함). 수식처럼 시작하는 칸(=,+,-,@)은 앞에 '를 붙여 실행되지 않게 */
export function toCsv(rows: (string | number)[][]) {
  const cell = (v: string | number) => {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
