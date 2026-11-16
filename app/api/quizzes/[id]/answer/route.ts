import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { isCorrect } from "@/lib/journal";
import { readTab, updateRow } from "@/lib/db";
import { today } from "@/lib/time";

const Body = z.object({ answer: z.string().max(100) });

/** 풀기: 지난날 낸 안 푼 문제, 또는 오답노트 문제(다시 풀기). 맞히면 오답노트에서 빠짐 */
export async function POST(req: Request, ctx: RouteContext<"/api/quizzes/[id]/answer">) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const { id } = await ctx.params;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "답을 써 주세요." }, { status: 400 });

  const rows = await readTab("퀴즈");
  const index = rows.findIndex((q) => q.quiz_id === id && q.student_id === s.sid);
  const q = rows[index];
  if (!q) return Response.json({ error: "문제를 찾을 수 없어요." }, { status: 404 });
  const t = today();
  if (q.date >= t) return Response.json({ error: "오늘 낸 문제는 내일 풀 수 있어요." }, { status: 400 });
  if (q.solved_date && q.correct !== "FALSE") return Response.json({ error: "이미 맞힌 문제예요." }, { status: 400 });

  const correct = isCorrect(q, body.data.answer);
  await updateRow("퀴즈", index, { ...q, solved_date: t, correct: correct ? "TRUE" : "FALSE" });
  return Response.json({ correct, answer: q.answer });
}
