import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { latestReflection, MOODS } from "@/lib/journal";
import { append, readWhere, updateRow } from "@/lib/db";
import { now, today } from "@/lib/time";

/** 오늘 내 회고 (없으면 null) */
export async function GET() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const r = latestReflection(await readWhere("회고", { student_id: s.sid, date: today() }), s.sid, today());
  return Response.json(r ? { learned: r.learned, mood: r.mood } : null);
}

const Body = z.object({
  learned: z.string().trim().min(1, "오늘 배운 것을 한 줄 써 주세요.").max(200),
  mood: z.enum(MOODS as [string, ...string[]]),
});

/** 한 줄 회고 저장 (같은 날 다시 쓰면 그 줄을 고침) */
export async function POST(req: Request) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: body.error.issues[0]?.message ?? "입력을 확인해 주세요." }, { status: 400 });
  const old = latestReflection(await readWhere("회고", { student_id: s.sid, date: today() }, 0), s.sid, today());
  if (old) await updateRow("회고", -1, { ...old, ...body.data, created_at: now() });
  else await append("회고", [{ student_id: s.sid, date: today(), ...body.data, week_review: "", created_at: now() }]);
  return Response.json({ ok: true });
}
