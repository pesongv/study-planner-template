import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createGoals, myGoals } from "@/lib/goal-store";
import { splitMonth } from "@/lib/goals";

const Body = z.object({ month_id: z.string().min(1).max(20) });

/** 월 목표 → 주차 목표 자동 분배 (이미 주차가 있으면 하지 않음). */
export async function POST(req: Request) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "월 목표를 골라 주세요." }, { status: 400 });

  const mine = await myGoals(s.sid);
  const month = mine.find((g) => g.goal_id === body.data.month_id && g.level === "month");
  if (!month) return Response.json({ error: "월 목표를 찾을 수 없어요." }, { status: 404 });
  if (mine.some((g) => g.parent_id === month.goal_id)) {
    return Response.json({ error: "이미 주차 목표가 있어요. 주간 화면에서 고쳐 주세요." }, { status: 400 });
  }
  return Response.json(await createGoals(s.sid, splitMonth(month)));
}
