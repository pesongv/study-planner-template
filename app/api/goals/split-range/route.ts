import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createGoals, myGoals } from "@/lib/goal-store";
import { append } from "@/lib/sheets";
import { rangeLabel, splitRanges, type Range } from "@/lib/goals";
import { now, today } from "@/lib/time";

const Body = z.object({
  goal_id: z.string().min(1).max(20),
  ranges: z.array(z.tuple([z.number().int().min(0).max(9999), z.number().int().min(0).max(9999)])).min(1).max(10),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rest_days: z.array(z.number().int().min(0).max(6)).max(6).default([]),
  review_days: z.number().int().min(0).max(7).default(0),
});

/** 월 목표의 범위를 시험 전날까지 하루 할 일로 나눔. 다시 누르면 오늘 이후 안 끝낸 날은 새로 나눈 걸로 바뀜. */
export async function POST(req: Request) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "범위와 시험 날을 확인해 주세요." }, { status: 400 });
  const o = body.data;
  if (o.ranges.some(([a, b]) => b < a)) return Response.json({ error: "끝 쪽이 시작 쪽보다 작은 범위가 있어요." }, { status: 400 });

  const mine = await myGoals(s.sid);
  const goal = mine.find((g) => g.goal_id === o.goal_id && g.level === "month");
  if (!goal) return Response.json({ error: "월 목표를 찾을 수 없어요." }, { status: 404 });
  const kids = mine.filter((g) => g.parent_id === goal.goal_id);
  if (kids.some((k) => k.level === "week")) {
    return Response.json({ error: "이미 주차로 나눈 목표예요. 새 월 목표를 만들어 나눠 주세요." }, { status: 400 });
  }

  const t = today();
  const parts = splitRanges({ ranges: o.ranges as Range[], from: t, examDate: o.exam_date, restDays: o.rest_days, reviewDays: o.review_days });
  if (!parts.length) return Response.json({ error: "시험 전까지 공부할 날이 없어요. 시험 날이나 쉬는 날을 확인해 주세요." }, { status: 400 });

  const stale = kids.filter((k) => k.period_start >= t && k.status !== "done");
  if (stale.length) await append("목표", stale.map((k) => ({ ...k, status: "deleted", updated_at: now() })));

  const unit = goal.unit || "쪽";
  const name = goal.subject || goal.title;
  const created = await createGoals(s.sid, parts.map((p) => ({
    level: "day", parent_id: goal.goal_id, period_start: p.date, period_end: p.date,
    title: `${name} ${rangeLabel(p.ranges, unit)}`, subject: goal.subject,
    target_amount: String(p.count), unit,
  })));
  return Response.json(created);
}
