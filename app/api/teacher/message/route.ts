import { z } from "zod";
import { randomUUID } from "node:crypto";
import { findUser, requireSession } from "@/lib/auth";
import { append } from "@/lib/db";
import { now } from "@/lib/time";

const Body = z.object({ student_id: z.string().trim().min(1).max(20), text: z.string().trim().min(1, "응원 한마디를 써 주세요.").max(200) });

/** 선생님 → 한 학생에게 응원 메시지 (학생이 앱을 열면 팝업으로 보여요) */
export async function POST(req: Request) {
  const s = await requireSession("teacher");
  if (s instanceof Response) return s;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: body.error.issues[0]?.message ?? "입력을 확인해 주세요." }, { status: 400 });
  const found = await findUser(body.data.student_id);
  if (!found || found.user.role !== "student") return Response.json({ error: "학생을 찾을 수 없어요." }, { status: 404 });
  await append("쪽지", [{ msg_id: randomUUID().slice(0, 8), student_id: body.data.student_id, text: body.data.text, created_at: now(), read_at: "" }]);
  return Response.json({ ok: true });
}
