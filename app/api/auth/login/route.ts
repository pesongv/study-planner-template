import { z } from "zod";
import { findUser, hash, setSession, verifyPw } from "@/lib/auth";
import { now } from "@/lib/time";
import { append, ensureTabs } from "@/lib/db";

const Body = z.object({ student_id: z.string().trim().min(1).max(20), password: z.string().min(1).max(100) });

// ponytail: 서버 메모리 잠금. 서버 재시작/다른 인스턴스에선 초기화됨 — 필요하면 시트에 기록
const fails = new Map<string, { count: number; until: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 5 * 60_000;

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "학번과 비밀번호를 입력해 주세요." }, { status: 400 });
  const { student_id: id, password } = body.data;

  const f = fails.get(id);
  if (f && f.until > Date.now()) {
    return Response.json({ error: "비밀번호를 여러 번 틀렸어요. 5분 뒤에 다시 해 보세요." }, { status: 429 });
  }

  // 최초 설치: TEACHER_INIT_PASSWORD로 teacher 로그인하면 시트 탭을 만들고 교사 계정을 생성
  const initPw = process.env.TEACHER_INIT_PASSWORD;
  const firstSetup = id === "teacher" && !!initPw && password === initPw;
  if (firstSetup) await ensureTabs();

  let found = await findUser(id);
  if (!found && firstSetup) {
    await append("학생", [{
      student_id: "teacher", name: "선생님", role: "teacher", password_hash: await hash(password),
      must_change_pw: "TRUE", created_at: now(),
    }]);
    found = await findUser(id);
  }

  if (!found || !(await verifyPw(password, found.user.password_hash))) {
    const lockExpired = f && f.until !== 0; // 잠금이 풀린 뒤라면 다시 0부터
    const count = (lockExpired ? 0 : f?.count ?? 0) + 1;
    fails.set(id, { count, until: count >= MAX_FAILS ? Date.now() + LOCK_MS : 0 });
    return Response.json({ error: "학번 또는 비밀번호가 맞지 않아요." }, { status: 401 });
  }

  fails.delete(id);
  await setSession(found.user);
  return Response.json({ role: found.user.role, must_change_pw: found.user.must_change_pw === "TRUE" });
}
