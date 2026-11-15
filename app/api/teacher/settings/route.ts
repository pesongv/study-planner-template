import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { append } from "@/lib/sheets";
import { today } from "@/lib/time";

const Body = z.object({
  cheer: z.string().trim().max(100).optional(),
  goal_hours: z.number().int().min(0).max(100000).optional(),
});

/** 응원 메시지 / 학급 목표 저장 (설정 탭에 새 줄 — 마지막 값이 현재). 목표를 새로 정하면 오늘부터 다시 셈 */
export async function POST(req: Request) {
  const s = await requireSession("teacher");
  if (s instanceof Response) return s;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "입력을 확인해 주세요." }, { status: 400 });
  const rows: { key: string; value: string }[] = [];
  if (body.data.cheer !== undefined) rows.push({ key: "cheer", value: body.data.cheer });
  if (body.data.goal_hours !== undefined) rows.push({ key: "goal_hours", value: String(body.data.goal_hours) }, { key: "goal_since", value: today() });
  if (rows.length) await append("설정", rows);
  return Response.json({ ok: true });
}
