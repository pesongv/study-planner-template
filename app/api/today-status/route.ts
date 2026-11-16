import { requireSession } from "@/lib/auth";
import { certify } from "@/lib/journal";
import { latestGoals } from "@/lib/goals";
import { readTabs } from "@/lib/db";
import { today } from "@/lib/time";

/** 오늘 인증 상태 (4가지 중 2개 이상이면 완료) */
export async function GET() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const tabs = await readTabs(["목표", "공부기록", "회고", "퀴즈"]);
  return Response.json(certify({
    dayGoals: latestGoals(tabs.목표.filter((g) => g.student_id === s.sid)),
    logs: tabs.공부기록, reflections: tabs.회고, quizzes: tabs.퀴즈, sid: s.sid, today: today(),
  }));
}
