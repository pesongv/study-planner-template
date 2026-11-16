import { requireSession } from "@/lib/auth";
import { lastActivity, openSession } from "@/lib/attendance";
import { readTabs, updateRow } from "@/lib/db";
import { now, today } from "@/lib/time";

export async function POST() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const { 출석: sessions, 공부기록: logs } = await readTabs(["출석", "공부기록"]);
  const open = openSession(sessions, s.sid, new Date(), lastActivity(logs, today()).get(s.sid));
  if (open) await updateRow("출석", open.index, { ...open.row, check_out: now() });
  return Response.json({ ok: true });
}
