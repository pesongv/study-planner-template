// 학생별 별 합계 (서버 전용). 나·순위·선생님 화면이 같은 숫자를 쓰도록 여기서만 계산.
// sid: 그 학생 기록만, since: 그 날짜부터의 기록만 읽음 (기록이 쌓여도 읽는 양이 안 늘게)
import "server-only";
import { readTabs, readWhere, type Where } from "./db";
import { latestGoals } from "./goals";
import { starTotals } from "./journal";
import { today } from "./time";

export async function loadStars(o: { sid?: string; since?: string; maxAgeMs?: number } = {}) {
  const t = today();
  const by: Where = o.sid ? { student_id: o.sid } : {};
  const from = (col: string): Where => (o.since ? { [col]: ["gte", o.since] } : {});
  const [small, 목표, 공부기록, 회고, 퀴즈, 출석] = await Promise.all([
    readTabs(["학생", "설정"], o.maxAgeMs),
    readWhere("목표", { ...by, ...from("period_start") }, o.maxAgeMs),
    readWhere("공부기록", { ...by, ...from("date") }, o.maxAgeMs),
    readWhere("회고", { ...by, ...from("date") }, o.maxAgeMs),
    readWhere("퀴즈", by, o.maxAgeMs), // 퀴즈는 하루 3개까지라 작음
    readWhere("출석", { ...by, ...from("date") }, o.maxAgeMs),
  ]);
  const tabs = { ...small, 목표, 공부기록, 회고, 퀴즈, 출석 };
  const goals = latestGoals(목표);
  const of = (sid: string) =>
    starTotals({ goals: goals.filter((g) => g.student_id === sid), logs: 공부기록, reflections: 회고, quizzes: 퀴즈, sid, today: t });
  return { tabs, today: t, of };
}
