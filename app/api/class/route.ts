import { requireSession } from "@/lib/auth";
import { latestSettings } from "@/lib/achieve";
import { readTabs, SHARED_CACHE_MS } from "@/lib/sheets";

/** 학급 공통: 선생님 응원 메시지, 학급 공동 목표(시간)와 지금까지 모은 시간 */
export async function GET() {
  const s = await requireSession();
  if (s instanceof Response) return s;
  const { 설정: rows, 공부기록: logs } = await readTabs(["설정", "공부기록"], s.role === "teacher" ? 0 : SHARED_CACHE_MS); // 선생님은 저장 직후 바로 보이게
  const set = latestSettings(rows);
  const since = set.goal_since ?? "";
  const minutes = logs.filter((l) => l.date >= since).reduce((sum, l) => sum + (Number(l.minutes) || 0), 0);
  return Response.json({ cheer: set.cheer ?? "", goalHours: Number(set.goal_hours) || 0, goalSince: since, minutes });
}
