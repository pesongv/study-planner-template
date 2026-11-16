import { requireSession } from "@/lib/auth";
import { lastActivity, openSession } from "@/lib/attendance";
import { readWhere, updateRow } from "@/lib/db";
import { now, today } from "@/lib/time";

export async function POST() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const mine = { student_id: s.sid, date: today() };
  const [sessions, logs] = await Promise.all([readWhere("출석", mine), readWhere("공부기록", mine)]);
  const open = openSession(sessions, s.sid, new Date(), lastActivity(logs, today()).get(s.sid));
  if (open) await updateRow("출석", open.index, { ...open.row, check_out: now() });
  return Response.json({ ok: true });
}
