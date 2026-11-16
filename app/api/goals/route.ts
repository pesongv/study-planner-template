import { requireSession } from "@/lib/auth";
import { createGoals, GoalFields, myGoals } from "@/lib/goal-store";
import { splitMonth, type Goal } from "@/lib/goals";

/** 내 목표 전체 (학생 한 명 분량이라 작음 — 화면에서 기간별로 거름). */
export async function GET() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  return Response.json(await myGoals(s.sid));
}

export async function POST(req: Request) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const body = GoalFields.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: body.error.issues[0]?.message ?? "입력을 확인해 주세요." }, { status: 400 });
  const goal = body.data;
  if (goal.period_end < goal.period_start) return Response.json({ error: "끝나는 날이 시작하는 날보다 빨라요." }, { status: 400 });

  const mine = await myGoals(s.sid);
  if (goal.parent_id && !mine.some((g) => g.goal_id === goal.parent_id)) {
    return Response.json({ error: "연결할 상위 목표를 찾을 수 없어요." }, { status: 400 });
  }
  const [created] = await createGoals(s.sid, [goal]);
  // 월 목표를 만들면 주간 목표도 같이 (월 → 주 → 하루가 항상 이어지게)
  if (created.level === "month") await createGoals(s.sid, splitMonth(created as Goal));
  return Response.json(created);
}
