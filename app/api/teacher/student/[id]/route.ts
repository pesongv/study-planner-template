import { requireSession } from "@/lib/auth";
import { loadStars } from "@/lib/star-store";
import { addDays, latestGoals, mondayOf, parseRanges, progress, rangesSummary } from "@/lib/goals";
import { readWhere } from "@/lib/db";
import { streaks } from "@/lib/achieve";
import { weekReport, weekReviewOf } from "@/lib/report";

/** 선생님용 학생 상세: 별·연속, 최근 14일, 오늘 할 일, 계획, 이번 주 리포트, 최근 한 줄 평, 낸 문제, 보낸 응원 */
export async function GET(_req: Request, ctx: RouteContext<"/api/teacher/student/[id]">) {
  const s = await requireSession("teacher");
  if (s instanceof Response) return s;
  const { id } = await ctx.params;
  const { tabs, today, of } = await loadStars({ sid: id });
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
    reflections: [...new Map(tabs.회고.filter((r) => r.student_id === id && r.learned).map((r) => [r.date, r])).values()].slice(-7).reverse().map((r) => ({ date: r.date, learned: r.learned, mood: r.mood })),
    wrong: tabs.퀴즈.filter((q) => q.student_id === id && q.correct === "FALSE").map((q) => ({ subject: q.subject, question: q.question, answer: q.answer })),
    // 계획: 이번 달·다음 달 월 목표, 이번 주 주간 목표, 앞으로 7일 할 일
    plans: {
      months: goals.filter((g) => g.level === "month" && g.period_end >= today).map((g) => ({
        title: g.title, subject: g.subject, ranges: rangesSummary(parseRanges(g.ranges_json)), progress: progress(g, goals),
      })),
      weeks: goals.filter((g) => g.level === "week" && g.period_start <= today && today <= g.period_end).map((g) => ({
        title: g.title, amount: g.target_amount ? `${g.target_amount}${g.unit}` : "", progress: progress(g, goals),
      })),
      upcoming: goals.filter((g) => g.level === "day" && g.period_start > today && g.period_start <= addDays(today, 7))
        .sort((a, b) => a.period_start.localeCompare(b.period_start)).map((g) => ({ date: g.period_start, title: g.title })),
      ddays: goals.filter((g) => g.level === "dday" && g.period_end >= today).map((g) => ({ title: g.title, date: g.period_end })),
    },
    // 낸 문제 전체 (최근 것 먼저)
    quizzes: tabs.퀴즈.filter((q) => q.student_id === id).reverse().map((q) => ({
      date: q.date, subject: q.subject, question: q.question, answer: q.answer, type: q.type,
      result: q.correct === "TRUE" ? "정답" : q.correct === "FALSE" ? "오답" : "아직",
    })),
    messages: (await readWhere("쪽지", { student_id: id }, 0)).reverse().map((m) => ({ text: m.text, sent: m.created_at, read: !!m.read_at, reaction: m.reaction })),
  });
}
