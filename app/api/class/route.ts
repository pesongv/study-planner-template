import { requireSession } from "@/lib/auth";
import { latestSettings } from "@/lib/achieve";
import { readTabs, readWhere, SHARED_CACHE_MS } from "@/lib/db";

/** 학급 공통: 선생님 응원 메시지, 학급 공동 목표(시간)와 지금까지 모은 시간 */
export async function GET() {
  const s = await requireSession();
  if (s instanceof Response) return s;
  const age = s.role === "teacher" ? 0 : SHARED_CACHE_MS; // 선생님은 저장 직후 바로 보이게
  const set = latestSettings((await readTabs(["설정"], age)).설정);
  const since = set.goal_since ?? "";
  const logs = set.goal_hours ? await readWhere("공부기록", { date: ["gte", since] }, age) : []; // 목표 정한 날부터만
  const minutes = logs.filter((l) => l.date >= since).reduce((sum, l) => sum + (Number(l.minutes) || 0), 0);
  return Response.json({ cheer: set.cheer ?? "", goalHours: Number(set.goal_hours) || 0, goalSince: since, minutes });
}
