import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { lastActivity, openSession } from "@/lib/attendance";
import { append, readWhere } from "@/lib/db";
import { now, today } from "@/lib/time";

export async function POST() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  // 이미 앉아 있으면 새로 기록하지 않음 (새로고침, 두 번 누르기)
  const mine = { student_id: s.sid, date: today() };
  const [sessions, logs] = await Promise.all([readWhere("출석", mine), readWhere("공부기록", mine)]);
  if (openSession(sessions, s.sid, new Date(), lastActivity(logs, today()).get(s.sid))) return Response.json({ ok: true, already: true });
  await append("출석", [{
    session_id: randomUUID().slice(0, 8), student_id: s.sid, date: today(), check_in: now(), check_out: "", method: "",
  }]);
  return Response.json({ ok: true });
}
