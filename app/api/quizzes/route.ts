import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { QUIZ_PER_DAY, type Quiz } from "@/lib/journal";
import { append, readTab } from "@/lib/sheets";
import { today } from "@/lib/time";

const view = (q: Quiz, withAnswer: boolean) => ({
  quiz_id: q.quiz_id, date: q.date, subject: q.subject, question: q.question, type: q.type,
  choices: q.choices_json ? (JSON.parse(q.choices_json) as string[]) : [],
  ...(withAnswer && { answer: q.answer }),
});

/** 오늘 낸 문제 / 풀 문제(지난날 낸 것 중 안 푼 것 — 정답은 안 보냄) / 오답노트 */
export async function GET() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const t = today();
  const mine = (await readTab("퀴즈")).filter((q) => q.student_id === s.sid);
  return Response.json({
    made: mine.filter((q) => q.date === t).map((q) => view(q, true)),
    toSolve: mine.filter((q) => q.date < t && !q.solved_date).map((q) => view(q, false)),
    wrong: mine.filter((q) => q.correct === "FALSE").map((q) => view(q, true)),
  });
}

const Body = z.discriminatedUnion("type", [
  z.object({ type: z.literal("short"), answer: z.string().trim().min(1, "정답을 써 주세요.").max(100) }),
  z.object({ type: z.literal("ox"), answer: z.enum(["O", "X"]) }),
  z.object({
    type: z.literal("choice"),
    choices: z.array(z.string().trim().min(1, "보기를 모두 채워 주세요.").max(100)).min(2).max(5),
    answer: z.string().trim().min(1, "정답 보기를 골라 주세요."),
  }),
]).and(z.object({
  subject: z.string().trim().max(20).default(""),
  question: z.string().trim().min(1, "문제를 써 주세요.").max(300),
}));

/** 문제 내기 (하루 3개까지) */
export async function POST(req: Request) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: body.error.issues[0]?.message ?? "입력을 확인해 주세요." }, { status: 400 });
  const q = body.data;
  if (q.type === "choice" && !q.choices.includes(q.answer)) return Response.json({ error: "정답 보기를 골라 주세요." }, { status: 400 });

  const t = today();
  const madeToday = (await readTab("퀴즈")).filter((x) => x.student_id === s.sid && x.date === t).length;
  if (madeToday >= QUIZ_PER_DAY) return Response.json({ error: `문제는 하루 ${QUIZ_PER_DAY}개까지예요. 내일 또 내 봐요!` }, { status: 400 });

  await append("퀴즈", [{
    quiz_id: randomUUID().slice(0, 8), student_id: s.sid, date: t, subject: q.subject, question: q.question,
    answer: q.answer, type: q.type, choices_json: q.type === "choice" ? JSON.stringify(q.choices) : "", solved_date: "", correct: "",
  }]);
  return Response.json({ ok: true });
}
