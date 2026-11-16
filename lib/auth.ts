// API 라우트용 인증 도우미 + 학생 계정 읽기/쓰기
import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { COOKIE, cookieOptions, signSession, verifySession, type Session } from "./session";
import { readTab } from "./db";
import type { Row } from "./schema";

export type User = Row<"학생">;

/**
 * 세션 검사. 실패하면 Response를 돌려주므로 라우트에서 `if (s instanceof Response) return s;`
 * 임시 비밀번호 상태(mcp)면 allowMcp인 라우트(비밀번호 변경, 내 정보)만 허용.
 */
export async function requireSession(role?: Session["role"], allowMcp = false): Promise<Session | Response> {
  const s = await verifySession((await cookies()).get(COOKIE)?.value);
  if (!s) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (s.mcp && !allowMcp) return Response.json({ error: "먼저 비밀번호를 바꿔 주세요." }, { status: 403 });
  if (role && s.role !== role) return Response.json({ error: "권한이 없어요." }, { status: 403 });
  return s;
}

export async function setSession(u: User) {
  const token = await signSession({
    sid: u.student_id,
    role: u.role === "teacher" ? "teacher" : "student",
    mcp: u.must_change_pw === "TRUE",
  });
  (await cookies()).set(COOKIE, token, cookieOptions);
}

export async function findUser(id: string) {
  const users = await readTab("학생");
  const index = users.findIndex((u) => u.student_id === id);
  return index < 0 ? null : { user: users[index], index };
}

export const hash = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPw = (pw: string, h: string) => bcrypt.compare(pw, h);

// ponytail: 선생님 요청으로 공통 임시 비밀번호. 첫 로그인 전엔 친구가 먼저 들어갈 수 있음 —
// 첫 로그인은 교실에서 다 같이. 학생별로 바꾸려면 String(randomInt(10000)).padStart(4, "0") (node:crypto)
export const tempPassword = () => "000000";

