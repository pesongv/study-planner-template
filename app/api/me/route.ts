import { cookies } from "next/headers";
import { findUser, requireSession } from "@/lib/auth";
import { RETURN_COOKIE } from "@/lib/session";

export async function GET() {
  const s = await requireSession(undefined, true);
  if (s instanceof Response) return s;
  const found = await findUser(s.sid);
  if (!found) return Response.json({ error: "계정을 찾을 수 없어요." }, { status: 404 });
  const { student_id, name, role, character, seat_no, must_change_pw } = found.user;
  const preview = !!(await cookies()).get(RETURN_COOKIE); // 선생님이 미리보기 중
  return Response.json({ student_id, name, role, character, seat_no, must_change_pw: must_change_pw === "TRUE", preview });
}
