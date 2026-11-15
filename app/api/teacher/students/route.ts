import { z } from "zod";
import { hash, requireSession, tempPassword, type User } from "@/lib/auth";
import { now } from "@/lib/time";
import { append, readTab } from "@/lib/sheets";
import { loadStars } from "@/lib/star-store";

export async function GET() {
  const s = await requireSession("teacher");
  if (s instanceof Response) return s;
  const { tabs, of } = await loadStars();
  return Response.json(
    tabs.학생
      .filter((u) => u.role === "student")
      .map(({ student_id, name, seat_no, must_change_pw }) => {
        const { todayMinutes, monthStars, totalStars, certToday } = of(student_id);
        return { student_id, name, seat_no, must_change_pw: must_change_pw === "TRUE", todayMinutes, monthStars, totalStars, certified: certToday };
      }),
  );
}

const Body = z.object({
  students: z
    .array(z.object({ student_id: z.string().trim().regex(/^\d{4,6}$/), name: z.string().trim().min(1).max(20) }))
    .min(1)
    .max(60),
});

/** 학생 일괄 등록. 이미 있는 학번은 건너뜀. 임시 비밀번호는 이 응답에서 한 번만 보여 줌. */
export async function POST(req: Request) {
  const s = await requireSession("teacher");
  if (s instanceof Response) return s;

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "명단 형식을 확인해 주세요. (학번은 숫자 4~6자리)" }, { status: 400 });
  }

  const users = await readTab("학생");
  const taken = new Set(users.map((u) => u.student_id));
  const usedSeats = new Set(users.map((u) => Number(u.seat_no)).filter(Boolean));
  const fresh = body.data.students
    .filter((st) => !taken.has(st.student_id) && taken.add(st.student_id))
    .sort((a, b) => a.student_id.localeCompare(b.student_id));

  let seat = 0;
  const nextSeat = () => {
    do seat++;
    while (usedSeats.has(seat));
    return seat;
  };

  const created: { student_id: string; name: string; password: string }[] = [];
  const rows: User[] = [];
  for (const st of fresh) {
    const password = tempPassword();
    created.push({ ...st, password });
    rows.push({
      student_id: st.student_id, name: st.name, role: "student", password_hash: await hash(password),
      character: "", seat_no: String(nextSeat()), must_change_pw: "TRUE", created_at: now(),
    });
  }
  if (rows.length) await append("학생", rows);

  return Response.json({ created, skipped: body.data.students.length - created.length });
}
