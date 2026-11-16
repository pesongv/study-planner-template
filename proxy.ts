// 페이지 접근 제어 (빠른 리다이렉트용). API는 각 라우트에서 requireSession으로 따로 검사
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySession } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const s = await verifySession(req.cookies.get(COOKIE)?.value);
  const path = req.nextUrl.pathname;
  const go = (to: string) => (path === to ? NextResponse.next() : NextResponse.redirect(new URL(to, req.url)));

  if (!s) return go("/login");
  if (s.mcp) return go("/change-password");
  const home = s.role === "teacher" ? "/teacher" : "/";
  if (path === "/login" || path === "/change-password") return go(home);
  if (path.startsWith("/teacher") && s.role !== "teacher") return go("/");
  if ((path === "/" || path === "/character" || path === "/plan" || path === "/journal" || path === "/report") && s.role === "teacher") return go("/teacher");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|characters|icon|apple-icon|manifest.webmanifest|opengraph-image).*)"], // 아이콘·매니페스트는 로그인 없이
};
