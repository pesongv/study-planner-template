// 회고·퀴즈 채점·오늘 인증 판정. 순수 함수만 — scripts/check.ts 에서 테스트
import type { Row } from "./schema";
import { summarize } from "./study.ts";

export type Quiz = Row<"퀴즈">;
export const MOODS = ["😀", "😐", "😞"];
export const QUIZ_PER_DAY = 3;
export const CERT_NEED = 2; // 4가지 중 몇 개 하면 인증
export const CERT_TIMER_MIN = 25;

/** 띄어쓰기·대소문자·끝 마침표 무시하고 비교 */
const norm = (s: string) => s.replace(/\s+/g, "").replace(/[.。]$/, "").toLowerCase();
export const isCorrect = (q: Pick<Quiz, "answer">, given: string) => norm(given) !== "" && norm(given) === norm(q.answer);

/** 같은 (학생, 날짜) 회고는 마지막 것이 현재 */
export function latestReflection(rows: Row<"회고">[], sid: string, day: string) {
  return rows.filter((r) => r.student_id === sid && r.date === day && r.learned).at(-1); // 주간 회고 줄은 learned가 비어 있음
}

/** 오늘 인증: 할 일 1개 이상 완료 · 타이머 25분 이상 · 회고 · 퀴즈 내기/풀기 중 2개 이상 */
export function certify(o: {
  dayGoals: Row<"목표">[]; // 이 학생의 최신 목표
  logs: Row<"공부기록">[];
  reflections: Row<"회고">[];
  quizzes: Quiz[];
  sid: string;
  today: string;
}) {
  const items = {
    todo: o.dayGoals.some((g) => g.level === "day" && g.period_start === o.today && g.status === "done"),
    timer: o.logs.filter((l) => l.student_id === o.sid && l.date === o.today).reduce((s, l) => s + (Number(l.minutes) || 0), 0) >= CERT_TIMER_MIN,
    reflection: !!latestReflection(o.reflections, o.sid, o.today)?.learned,
    quiz: o.quizzes.some((q) => q.student_id === o.sid && (q.date === o.today || q.solved_date === o.today)),
  };
  const count = Object.values(items).filter(Boolean).length;
  return { ...items, count, done: count >= CERT_NEED };
}

/**
 * 별 합계 = 타이머 별(25분당 1개) + 인증한 날마다 1개.
 * goals는 이 학생의 최신 목표. 활동이 있었던 날마다 인증 여부를 다시 계산.
 */
// ponytail: 날마다 전체 기록을 다시 훑음 (학생 25명 × 수백 일이면 충분). 느려지면 날짜별로 묶어서 계산
export function starTotals(o: { goals: Row<"목표">[]; logs: Row<"공부기록">[]; reflections: Row<"회고">[]; quizzes: Quiz[]; sid: string; today: string }) {
  const mine = o.logs.filter((l) => l.student_id === o.sid);
  const s = summarize(mine, o.today);
  const days = new Set([
    ...o.goals.filter((g) => g.level === "day" && g.status === "done").map((g) => g.period_start),
    ...mine.map((l) => l.date),
    ...o.reflections.filter((r) => r.student_id === o.sid).map((r) => r.date),
    ...o.quizzes.filter((q) => q.student_id === o.sid).flatMap((q) => [q.date, q.solved_date]),
  ]);
  let certToday = false;
  const certDays: string[] = [];
  for (const day of days) {
    if (!day || day > o.today || !certify({ dayGoals: o.goals, logs: mine, reflections: o.reflections, quizzes: o.quizzes, sid: o.sid, today: day }).done) continue;
    certDays.push(day);
    s.totalStars++;
    if (day.slice(0, 7) === o.today.slice(0, 7)) s.monthStars++;
    if (day === o.today) {
      s.todayStars++;
      certToday = true;
    }
  }
  return { ...s, certToday, certDays };
}
