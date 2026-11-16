import { cookies } from "next/headers";
import { COOKIE, RETURN_COOKIE, cookieOptions, verifySession } from "@/lib/session";

/** 미리보기 끝: 맡겨 둔 선생님 로그인으로 돌아가기 */
export async function POST() {
  const jar = await cookies();
  const token = jar.get(RETURN_COOKIE)?.value;
  const teacher = await verifySession(token);
  if (!token || teacher?.role !== "teacher") return Response.json({ error: "선생님 로그인 정보가 없어요. 다시 로그인해 주세요." }, { status: 400 });
  jar.set(COOKIE, token, cookieOptions);
  jar.delete(RETURN_COOKIE);
  return Response.json({ ok: true });
}
