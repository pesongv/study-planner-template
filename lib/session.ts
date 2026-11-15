// JWT 세션 (httpOnly 쿠키). proxy.ts와 API 라우트가 같이 사용
import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "sp_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7일
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export type Session = { sid: string; role: "student" | "teacher"; mcp: boolean }; // mcp = must_change_pw

export async function signSession(s: Session) {
  return new SignJWT(s).setProtectedHeader({ alg: "HS256" }).setExpirationTime(`${MAX_AGE}s`).sign(secret);
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<Session>(token, secret);
    if (payload.role !== "student" && payload.role !== "teacher") return null; // 타이머 표 등 다른 토큰 거절
    return { sid: payload.sid, role: payload.role, mcp: payload.mcp };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

// 타이머 시작 표: 서버가 시작 시각에 서명 → 끝낼 때 서버가 경과 시간을 계산 (학생이 분을 지어낼 수 없음)
export type TimerTicket = { sid: string; method: string; start: number; goal_id: string; jti: string };

export async function signTimer(t: TimerTicket) {
  return new SignJWT(t).setProtectedHeader({ alg: "HS256" }).setExpirationTime("6h").sign(secret);
}

export async function verifyTimer(token: string): Promise<TimerTicket | null> {
  try {
    const { payload } = await jwtVerify<TimerTicket>(token, secret);
    if (typeof payload.start !== "number" || typeof payload.jti !== "string") return null; // 로그인 토큰 등 거절
    return { sid: payload.sid, method: payload.method, start: payload.start, goal_id: payload.goal_id, jti: payload.jti };
  } catch {
    return null;
  }
}
