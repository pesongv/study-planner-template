import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { signTimer } from "@/lib/session";

const Body = z.object({ method: z.enum(["pomodoro", "50-10", "free"]), goal_id: z.string().max(20).default("") });

export async function POST(req: Request) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "공부법을 골라 주세요." }, { status: 400 });
  const start = Date.now();
  const token = await signTimer({ sid: s.sid, method: body.data.method, start, goal_id: body.data.goal_id, jti: randomUUID().slice(0, 8) });
  return Response.json({ token, start });
}
