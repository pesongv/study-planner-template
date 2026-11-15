import { requireSession } from "@/lib/auth";
import { GoalPatch, myGoals, saveGoal } from "@/lib/goal-store";

/** 수정 / 체크 / 이월(날짜 변경) / 삭제(status=deleted) */
export async function PATCH(req: Request, ctx: RouteContext<"/api/goals/[id]">) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const { id } = await ctx.params;
  const body = GoalPatch.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: body.error.issues[0]?.message ?? "입력을 확인해 주세요." }, { status: 400 });

  const goal = (await myGoals(s.sid)).find((g) => g.goal_id === id);
  if (!goal) return Response.json({ error: "목표를 찾을 수 없어요." }, { status: 404 });
  const next = { ...goal, ...body.data };
  if (next.period_end < next.period_start) return Response.json({ error: "끝나는 날이 시작하는 날보다 빨라요." }, { status: 400 });
  return Response.json(await saveGoal(next));
}
