import { requireSession } from "@/lib/auth";
import { certify } from "@/lib/journal";
import { latestGoals } from "@/lib/goals";
import { readWhere } from "@/lib/db";
import { today } from "@/lib/time";

/** 오늘 인증 상태 (4가지 중 2개 이상이면 완료) */
export async function GET() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const t = today();
  const [goals, logs, reflections, quizzes] = await Promise.all([
    readWhere("목표", { student_id: s.sid, period_start: t }),
    readWhere("공부기록", { student_id: s.sid, date: t }),
    readWhere("회고", { student_id: s.sid, date: t }),
    readWhere("퀴즈", { student_id: s.sid }),
  ]);
  return Response.json(certify({
    dayGoals: latestGoals(goals), logs, reflections, quizzes, sid: s.sid, today: t,
  }));
}
