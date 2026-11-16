import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createGoals, myGoals, RangeItemSchema } from "@/lib/goal-store";
import { append } from "@/lib/sheets";
import { addDays, mondayOf, rangeLabel, splitRanges, weekTitle, type Goal } from "@/lib/goals";
import { now, today } from "@/lib/time";

const Body = z.object({
  goal_id: z.string().min(1).max(20),
  ranges: z.array(RangeItemSchema).min(1, "범위를 넣어 주세요.").max(10),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rest_days: z.array(z.number().int().min(0).max(6)).max(6).default([]),
  review_days: z.number().int().min(0).max(7).default(0),
});

/** 월 목표의 범위를 시험 전날까지 하루 할 일로 나눔 (주간 목표 아래로 묶음). 다시 누르면 오늘 이후 안 끝낸 날은 새로 나눈 걸로 바뀜. */
export async function POST(req: Request) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: body.error.issues[0]?.message ?? "범위와 시험 날을 확인해 주세요." }, { status: 400 });
  const o = body.data;

  const mine = await myGoals(s.sid);
  const goal = mine.find((g) => g.goal_id === o.goal_id && g.level === "month");
  if (!goal) return Response.json({ error: "월 목표를 찾을 수 없어요." }, { status: 404 });
  const weeks = mine.filter((g) => g.parent_id === goal.goal_id && g.level === "week");
  const weekIds = new Set(weeks.map((w) => w.goal_id));

  const t = today();
  const parts = splitRanges({ ranges: o.ranges, from: t, examDate: o.exam_date, restDays: o.rest_days, reviewDays: o.review_days });
  if (!parts.length) return Response.json({ error: "시험 전까지 공부할 날이 없어요. 시험 날이나 쉬는 날을 확인해 주세요." }, { status: 400 });

  // 다시 나누기: 오늘 이후 안 끝낸 하루 할 일은 지우고 새로
  const writes: Goal[] = mine
    .filter((g) => g.level === "day" && (g.parent_id === goal.goal_id || weekIds.has(g.parent_id)) && g.period_start >= t && g.status !== "done")
    .map((g) => ({ ...g, status: "deleted", updated_at: now() }));

  writes.push({ ...goal, ranges_json: JSON.stringify(o.ranges), updated_at: now() }); // 다음에 다시 나눌 때 그대로 채워지게

  // 하루 할 일을 그 주의 주간 목표 아래로: 주간 목표가 있으면 목표량만 맞추고, 없으면 새로 만듦
  // 하루·주 분량의 단위: 한 가지면 그 단위, 쪽·장이 섞이면 숫자만 (1장 = 1쪽 분량)
  const unitOf = (segs: { i: number }[]) => {
    const units = new Set(segs.map((g) => o.ranges[g.i].unit));
    return units.size === 1 ? [...units][0] : "";
  };
  const byWeek = new Map<string, typeof parts>();
  for (const p of parts) byWeek.set(mondayOf(p.date), [...(byWeek.get(mondayOf(p.date)) ?? []), p]);
  const newWeeks: Partial<Goal>[] = [];
  for (const [monday, ps] of byWeek) {
    const amount = String(ps.reduce((n, p) => n + p.count, 0));
    const unit = unitOf(ps.flatMap((p) => p.segs));
    const w = weeks.find((x) => x.period_start === monday);
    if (w) writes.push({ ...w, target_amount: amount, unit, updated_at: now() });
    else newWeeks.push({
      level: "week", parent_id: goal.goal_id, period_start: monday, period_end: addDays(monday, 6),
      title: weekTitle(goal.title, monday), subject: goal.subject, target_amount: amount, unit,
    });
  }
  if (writes.length) await append("목표", writes);
  const createdWeeks = newWeeks.length ? await createGoals(s.sid, newWeeks) : [];
  const weekOf = new Map([...weeks, ...createdWeeks].map((w) => [w.period_start, w.goal_id]));

  const name = goal.subject || goal.title;
  const created = await createGoals(s.sid, parts.map((p) => ({
    level: "day", parent_id: weekOf.get(mondayOf(p.date)), period_start: p.date, period_end: p.date,
    title: `${name} ${rangeLabel(p.segs, o.ranges)}`, subject: goal.subject,
    target_amount: String(p.count), unit: unitOf(p.segs),
  })));
  return Response.json(created);
}
