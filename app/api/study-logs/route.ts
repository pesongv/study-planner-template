import { requireSession } from "@/lib/auth";
import { loadStars } from "@/lib/star-store";

/** 내 공부 시간·별 요약 (타이머 별 + 인증 별) */
export async function GET() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const { todayMinutes, todayStars, monthStars, totalStars } = (await loadStars()).of(s.sid);
  return Response.json({ todayMinutes, todayStars, monthStars, totalStars });
}
