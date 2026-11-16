import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { verifyTimer } from "@/lib/session";
import { myGoals } from "@/lib/goal-store";
import { append, readWhere } from "@/lib/db";
import { METHODS, starsFor, type Method } from "@/lib/study";
import { now, today } from "@/lib/time";

const Body = z.object({ token: z.string().min(1).max(1000) });

/** 타이머 끝: 서버가 잰 시간(공부법 최대치까지)을 공부기록에 저장. 같은 표는 한 번만. */
export async function POST(req: Request) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const body = Body.safeParse(await req.json().catch(() => null));
  const t = body.success ? await verifyTimer(body.data.token) : null;
  if (!t || t.sid !== s.sid) return Response.json({ error: "타이머 정보가 맞지 않아요. 다시 시작해 주세요." }, { status: 400 });

  const method = METHODS[t.method as Method];
  const minutes = Math.min(method.cap, Math.floor((Date.now() - t.start) / 60_000));
  if (minutes < 1) return Response.json({ minutes: 0, stars: 0 });

  const [existing] = await readWhere("공부기록", { log_id: t.jti }, 0);
  if (existing) return Response.json({ minutes: Number(existing.minutes), stars: starsFor(Number(existing.minutes)), already: true });

  const goal = t.goal_id ? (await myGoals(s.sid)).find((g) => g.goal_id === t.goal_id) : undefined;
  await append("공부기록", [{
    log_id: t.jti, student_id: s.sid, date: today(), goal_id: goal?.goal_id ?? "", subject: goal?.subject ?? "",
    minutes: String(minutes), method: t.method, created_at: now(),
  }]);
  return Response.json({ minutes, stars: starsFor(minutes) });
}
