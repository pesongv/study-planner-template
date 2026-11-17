import { requireSession } from "@/lib/auth";
import { readWhere, updateRow } from "@/lib/db";
import { REACTIONS } from "@/lib/reactions";
import { now } from "@/lib/time";

/** 내 응원 메시지 (최근 20개, 안 읽은 것 표시) */
export async function GET() {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const rows = await readWhere("쪽지", { student_id: s.sid }, 0);
  return Response.json(rows.slice(-20).reverse().map((m) => ({ id: m.msg_id, text: m.text, sent: m.created_at, unread: !m.read_at, reaction: m.reaction })));
}

/** { id, reaction } 이면 그 메시지에 반응 남기기(같은 걸 다시 누르면 취소), 아니면 안 읽은 메시지를 모두 읽음으로 */
export async function POST(req: Request) {
  const s = await requireSession("student");
  if (s instanceof Response) return s;
  const body = await req.json().catch(() => null);
  if (body?.id) {
    if (typeof body.reaction !== "string" || (body.reaction && !REACTIONS.includes(body.reaction))) return Response.json({ error: "반응을 확인해 주세요." }, { status: 400 });
    const [m] = await readWhere("쪽지", { student_id: s.sid, msg_id: String(body.id) }, 0);
    if (!m) return Response.json({ error: "메시지를 찾을 수 없어요." }, { status: 404 });
    await updateRow("쪽지", -1, { ...m, reaction: body.reaction, read_at: m.read_at || now() });
    return Response.json({ ok: true });
  }
  const unread = (await readWhere("쪽지", { student_id: s.sid, read_at: "" }, 0));
  const t = now();
  await Promise.all(unread.map((m) => updateRow("쪽지", -1, { ...m, read_at: t })));
  return Response.json({ ok: true });
}
