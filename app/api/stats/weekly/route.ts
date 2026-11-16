import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { loadStars } from "@/lib/star-store";
import { latestGoals, mondayOf } from "@/lib/goals";
import { weekReport, weekReviewOf } from "@/lib/report";
import { append } from "@/lib/db";
import { now } from "@/lib/time";

const Week = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** 내 주간 리포트. ?week=그 주 아무 날짜 (기본: 이번 주) */
export async function GET(req: Request) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const { tabs, today, of } = await loadStars({ sid: s.sid });
  const q = Week.safeParse(new URL(req.url).searchParams.get("week"));
  const monday = mondayOf(q.success ? q.data : today);
  return Response.json({
    monday,
    ...weekReport({
      monday,
      logs: tabs.공부기록.filter((l) => l.student_id === s.sid),
      goals: latestGoals(tabs.목표.filter((g) => g.student_id === s.sid)),
      certDays: of(s.sid).certDays,
    }),
    review: weekReviewOf(tabs.회고, s.sid, monday),
  });
}

const Body = z.object({ week: Week, text: z.string().trim().min(1, "한 주를 돌아보며 한두 줄 써 주세요.").max(500) });

/** 주간 회고 저장 (회고 탭, date=그 주 월요일) */
export async function POST(req: Request) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: body.error.issues[0]?.message ?? "입력을 확인해 주세요." }, { status: 400 });
  await append("회고", [{ student_id: s.sid, date: mondayOf(body.data.week), learned: "", mood: "", week_review: body.data.text, created_at: now() }]);
  return Response.json({ ok: true });
}
