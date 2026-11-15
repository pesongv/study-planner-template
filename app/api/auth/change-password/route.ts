import { z } from "zod";
import { findUser, hash, requireSession, setSession, verifyPw } from "@/lib/auth";
import { updateRow } from "@/lib/sheets";

const Body = z.object({
  current: z.string().min(1).max(100),
  next: z.string().min(6, "새 비밀번호는 6자 이상으로 해 주세요.").max(100),
});

export async function POST(req: Request) {
  const s = await requireSession(undefined, true);
  if (s instanceof Response) return s;

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: body.error.issues[0]?.message ?? "입력을 확인해 주세요." }, { status: 400 });
  }
  const { current, next } = body.data;
  if (current === next) return Response.json({ error: "지금과 다른 비밀번호로 바꿔 주세요." }, { status: 400 });

  const found = await findUser(s.sid);
  if (!found || !(await verifyPw(current, found.user.password_hash))) {
    return Response.json({ error: "지금 비밀번호가 맞지 않아요." }, { status: 401 });
  }

  const user = { ...found.user, password_hash: await hash(next), must_change_pw: "FALSE" };
  await updateRow("학생", found.index, user);
  await setSession(user);
  return Response.json({ role: user.role });
}
