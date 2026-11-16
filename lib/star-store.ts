// 학생별 별 합계 (서버 전용). 시트는 한 번에 읽음 — 나·순위·선생님 화면이 같은 숫자를 쓰도록 여기서만 계산
import "server-only";
import { readTabs } from "./db";
import { latestGoals } from "./goals";
import { starTotals } from "./journal";
import { today } from "./time";

export async function loadStars(maxAgeMs?: number) {
  const tabs = await readTabs(["학생", "목표", "공부기록", "회고", "퀴즈", "출석", "설정"], maxAgeMs);
  const t = today();
  const goals = latestGoals(tabs.목표);
  const of = (sid: string) =>
    starTotals({ goals: goals.filter((g) => g.student_id === sid), logs: tabs.공부기록, reflections: tabs.회고, quizzes: tabs.퀴즈, sid, today: t });
  return { tabs, today: t, of };
}
