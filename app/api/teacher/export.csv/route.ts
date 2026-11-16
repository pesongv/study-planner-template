import { requireSession } from "@/lib/auth";
import { loadStars } from "@/lib/star-store";
import { addDays, lastDayOf, latestGoals } from "@/lib/goals";
import { starsFor } from "@/lib/study";
import { latestReflection } from "@/lib/journal";
import { toCsv } from "@/lib/report";
import { today as kstToday } from "@/lib/time";

/** 한 달 기록 CSV (학생 × 날짜, 활동 있는 날만). ?month=YYYY-MM (기본: 이번 달) */
export async function GET(req: Request) {
  const s = await requireSession("teacher");
  if (s instanceof Response) return s;
  const q = new URL(req.url).searchParams.get("month");
  const month = q && /^\d{4}-\d{2}$/.test(q) ? q : kstToday().slice(0, 7);
  const { tabs, today, of } = await loadStars({ since: month + "-01" }); // 그 달부터의 기록만
  const last = lastDayOf(month) < today ? lastDayOf(month) : today;
  const goals = latestGoals(tabs.목표);

  const rows: (string | number)[][] = [["날짜", "학번", "이름", "출석", "공부(분)", "타이머 별", "할 일(완료/전체)", "오늘 인증", "한 줄 평", "기분"]];
  for (const u of tabs.학생.filter((x) => x.role === "student")) {
    const id = u.student_id;
    const certDays = new Set(of(id).certDays);
    for (let d = month + "-01"; d <= last; d = addDays(d, 1)) {
      const logs = tabs.공부기록.filter((l) => l.student_id === id && l.date === d);
      const minutes = logs.reduce((sum, l) => sum + (Number(l.minutes) || 0), 0);
      const dayGoals = goals.filter((g) => g.student_id === id && g.level === "day" && g.period_start === d);
      const attended = tabs.출석.some((r) => r.student_id === id && r.date === d);
      const refl = latestReflection(tabs.회고, id, d);
      if (!attended && !minutes && !dayGoals.length && !refl) continue;
      rows.push([
        d, id, u.name, attended ? "O" : "", minutes, logs.reduce((sum, l) => sum + starsFor(Number(l.minutes) || 0), 0),
        dayGoals.length ? `${dayGoals.filter((g) => g.status === "done").length}/${dayGoals.length}` : "",
        certDays.has(d) ? "O" : "", refl?.learned ?? "", refl?.mood ?? "",
      ]);
    }
  }
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`우리반독서실_${month}.csv`)}`,
    },
  });
}
