import { requireSession } from "@/lib/auth";
import { lastActivity, maskName, openSession } from "@/lib/attendance";
import { readTabs, SHARED_CACHE_MS } from "@/lib/db";
import { today } from "@/lib/time";

/** 독서실 현황: 자리마다 이름(학생에게는 가림, 선생님에게는 실명), 캐릭터, 앉아 있는지. */
export async function GET() {
  const s = await requireSession();
  if (s instanceof Response) return s;
  const { 학생: users, 출석: sessions, 공부기록: logs } = await readTabs(["학생", "출석", "공부기록"], SHARED_CACHE_MS);
  const at = new Date();
  const lastActive = lastActivity(logs, today(at));
  const seats = users
    .filter((u) => u.role === "student" && u.seat_no)
    .map((u) => ({
      seat_no: Number(u.seat_no),
      name: u.student_id === s.sid || s.role === "teacher" ? u.name : maskName(u.name), // 선생님은 실명
      character: u.character,
      present: !!openSession(sessions, u.student_id, at, lastActive.get(u.student_id)),
      me: u.student_id === s.sid,
    }))
    .sort((a, b) => a.seat_no - b.seat_no);
  return Response.json({ seats });
}
