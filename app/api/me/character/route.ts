import { z } from "zod";
import { findUser, requireSession } from "@/lib/auth";
import { CHARACTERS } from "@/lib/characters";
import { updateRow } from "@/lib/sheets";

const Body = z.object({ character: z.enum(CHARACTERS.map((c) => c.id) as [string, ...string[]]) });

export async function PATCH(req: Request) {
  const s = await requireSession();
  if (s instanceof Response) return s;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "캐릭터를 골라 주세요." }, { status: 400 });
  const found = await findUser(s.sid);
  if (!found) return Response.json({ error: "계정을 찾을 수 없어요." }, { status: 404 });
  await updateRow("학생", found.index, { ...found.user, character: body.data.character });
  return Response.json({ ok: true });
}
