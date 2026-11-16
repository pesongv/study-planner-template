import { requireSession } from "@/lib/auth";
import { maskName } from "@/lib/attendance";
import { loadStars } from "@/lib/star-store";
import { SHARED_CACHE_MS } from "@/lib/db";
import { today } from "@/lib/time";

const TOP = 5;

/** 학생용: 이번 달 별 상위 5명 (이름 가림, 학번 없음) */
export async function GET() {
  const s = await requireSession();
  if (s instanceof Response) return s;
  const { tabs, of } = await loadStars({ since: today().slice(0, 7) + "-01", maxAgeMs: SHARED_CACHE_MS }); // 이번 달 기록만
  const top = tabs.학생
    .filter((u) => u.role === "student")
    .map((u) => ({ id: u.student_id, name: maskName(u.name), stars: of(u.student_id).monthStars }))
    .filter((r) => r.stars > 0)
    .sort((a, b) => b.stars - a.stars)
    .slice(0, TOP)
    .map(({ id, name, stars }) => ({ name, stars, me: id === s.sid }));
  return Response.json(top);
}
