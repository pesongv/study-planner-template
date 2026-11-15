import { requireSession } from "@/lib/auth";
import { badgesFor, bestWeek, streaks, weekCompare } from "@/lib/achieve";
import { loadStars } from "@/lib/star-store";

/** 내 연속 인증, 뱃지, 지난주 비교 */
export async function GET() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const { tabs, today, of } = await loadStars();
  const me = of(s.sid);
  const logs = tabs.공부기록.filter((l) => l.student_id === s.sid);
  const streak = streaks(me.certDays, today);
  return Response.json({
    streak: streak.current,
    week: weekCompare(logs, today),
    badges: badgesFor({
      checkins: tabs.출석.filter((r) => r.student_id === s.sid).length,
      certDays: me.certDays.length,
      maxStreak: streak.max,
      bestWeek: bestWeek(me.certDays),
      totalMinutes: logs.reduce((sum, l) => sum + (Number(l.minutes) || 0), 0),
      quizCorrect: tabs.퀴즈.filter((q) => q.student_id === s.sid && q.correct === "TRUE").length,
      totalStars: me.totalStars,
    }),
  });
}
