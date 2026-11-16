import { cookies } from "next/headers";
import { requireSession } from "@/lib/auth";
import { readTab } from "@/lib/db";
import { COOKIE, RETURN_COOKIE, cookieOptions, signSession } from "@/lib/session";

/** 선생님 → 테스트 계정(이름에 '테스트'가 들어간 학생)으로 학생 화면 미리보기 */
export async function POST() {
  const s = await requireSession("teacher");
  if (s instanceof Response) return s;
  const test = (await readTab("학생")).find((u) => u.role === "student" && u.name.includes("테스트"));
  if (!test) {
    return Response.json({ error: "학생 명단에 이름이 '테스트'인 학생(예: 99999,테스트)을 등록하면 미리보기를 쓸 수 있어요." }, { status: 404 });
  }
  const jar = await cookies();
  jar.set(RETURN_COOKIE, jar.get(COOKIE)!.value, cookieOptions);
  jar.set(COOKIE, await signSession({ sid: test.student_id, role: "student", mcp: false }), cookieOptions);
  return Response.json({ ok: true });
}
