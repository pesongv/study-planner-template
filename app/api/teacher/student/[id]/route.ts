import { requireSession } from "@/lib/auth";
import { loadStars } from "@/lib/star-store";
import { addDays, latestGoals, mondayOf } from "@/lib/goals";
import { streaks } from "@/lib/achieve";
import { weekReport, weekReviewOf } from "@/lib/report";

/** 선생님용 학생 상세: 별·연속, 최근 14일, 오늘 할 일, 이번 주 리포트, 최근 회고, 오답 */
export async function GET(_req: Request, ctx: RouteContext<"/api/teacher/student/[id]">) {
  const s = await requireSession("teacher");
  if (s instanceof Response) return s;
  const { id } = await ctx.params;
  const { tabs, today, of } = await loadStars();
  const u = tabs.학생.find((x) => x.student_id === id && x.role === "student");
  if (!u) return Response.json({ error: "학생을 찾을 수 없어요." }, { status: 404 });

  const me = of(id);
  const logs = tabs.공부기록.filter((l) => l.student_id === id);
  const goals = latestGoals(tabs.목표.filter((g) => g.student_id === id));
  const monday = mondayOf(today);
  const certSet = new Set(me.certDays);
  return Response.json({
    student: { student_id: u.student_id, name: u.name, seat_no: u.seat_no, character: u.character },
    stars: { month: me.monthStars, total: me.totalStars },
    streak: streaks(me.certDays, today).current,
    last14: Array.from({ length: 14 }, (_, i) => addDays(today, i - 13)).map((date) => ({
      date,
      minutes: logs.filter((l) => l.date === date).reduce((sum, l) => sum + (Number(l.minutes) || 0), 0),
      cert: certSet.has(date),
    })),
    todayGoals: goals.filter((g) => g.level === "day" && g.period_start === today).map((g) => ({ title: g.title, done: g.status === "done" })),
    week: { ...weekReport({ monday, logs, goals, certDays: me.certDays }), review: weekReviewOf(tabs.회고, id, monday) },
    reflections: tabs.회고.filter((r) => r.student_id === id && r.learned).slice(-7).reverse().map((r) => ({ date: r.date, learned: r.learned, mood: r.mood })),
    wrong: tabs.퀴즈.filter((q) => q.student_id === id && q.correct === "FALSE").map((q) => ({ subject: q.subject, question: q.question, answer: q.answer })),
  });
}
