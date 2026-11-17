import { requireSession } from "@/lib/auth";
import { lastActivity, maskName, openSession } from "@/lib/attendance";
import { readTabs, readWhere, SHARED_CACHE_MS } from "@/lib/db";
import { today } from "@/lib/time";

/** 독서실 현황: 자리마다 이름(학생에게는 가림, 선생님에게는 실명), 캐릭터, 앉아 있는지. */
export async function GET() {
  const s = await requireSession();
  if (s instanceof Response) return s;
  const at = new Date();
  const t = today(at);
  // 오늘 출석·오늘 공부기록만
  const [{ 학생: users }, sessions, logs] = await Promise.all([
    readTabs(["학생"], SHARED_CACHE_MS),
    readWhere("출석", { date: t }, SHARED_CACHE_MS),
    readWhere("공부기록", { date: t }, SHARED_CACHE_MS),
  ]);
  const lastActive = lastActivity(logs, t);
  const seats = users
    .filter((u) => u.role === "student" && u.seat_no)
    .map((u) => ({
      seat_no: Number(u.seat_no),
      name: u.student_id === s.sid || s.role === "teacher" ? u.name : maskName(u.name), // 선생님은 실명
      character: u.character,
      present: !!openSession(sessions, u.student_id, at, lastActive.get(u.student_id)),
      me: u.student_id === s.sid,
      ...(s.role === "teacher" && { student_id: u.student_id }), // 학생에게는 학번을 안 보냄
    }))
    .sort((a, b) => a.seat_no - b.seat_no);
  return Response.json({ seats });
}
