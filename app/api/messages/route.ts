import { requireSession } from "@/lib/auth";
import { readWhere, updateRow } from "@/lib/db";
import { now } from "@/lib/time";

/** 내 응원 메시지 (최근 20개, 안 읽은 것 표시) */
export async function GET() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const rows = await readWhere("쪽지", { student_id: s.sid }, 0);
  return Response.json(rows.slice(-20).reverse().map((m) => ({ text: m.text, sent: m.created_at, unread: !m.read_at })));
}

/** 안 읽은 메시지를 모두 읽음으로 */
export async function POST() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const unread = (await readWhere("쪽지", { student_id: s.sid, read_at: "" }, 0));
  const t = now();
  await Promise.all(unread.map((m) => updateRow("쪽지", -1, { ...m, read_at: t })));
  return Response.json({ ok: true });
}
