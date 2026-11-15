import { z } from "zod";
import { findUser, hash, requireSession, tempPassword } from "@/lib/auth";
import { updateRow } from "@/lib/sheets";

const Body = z.object({ student_id: z.string().trim().regex(/^\d{4,6}$/) });

export async function POST(req: Request) {
  const s = await requireSession("teacher");
  if (s instanceof Response) return s;

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "학번을 확인해 주세요." }, { status: 400 });

  const found = await findUser(body.data.student_id);
  if (!found || found.user.role !== "student") return Response.json({ error: "학생을 찾을 수 없어요." }, { status: 404 });

  const password = tempPassword();
  await updateRow("학생", found.index, { ...found.user, password_hash: await hash(password), must_change_pw: "TRUE" });
  return Response.json({ student_id: found.user.student_id, name: found.user.name, password });
}
