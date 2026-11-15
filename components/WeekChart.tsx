// 주간 리포트 그림: 요일별 공부 시간 막대 + 과목별 막대 + 달성률·인증
export type WeekData = {
  monday: string;
  days: { date: string; minutes: number }[];
  subjects: { subject: string; minutes: number }[];
  goals: { done: number; total: number };
  certDays: number;
};

const DOW = ["월", "화", "수", "목", "금", "토", "일"];
const hm = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ""}` : `${m}분`);

export function WeekChart({ w }: { w: WeekData }) {
  const total = w.days.reduce((s, d) => s + d.minutes, 0);
  const maxDay = Math.max(30, ...w.days.map((d) => d.minutes));
  const maxSub = Math.max(1, ...w.subjects.map((s) => s.minutes));
  const rate = w.goals.total ? Math.round((w.goals.done / w.goals.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["⏱️ 공부", hm(total)],
          ["✅ 할 일", w.goals.total ? `${rate}%` : "-"],
          ["🏅 인증", `${w.certDays}일`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-zinc-50 p-2 dark:bg-zinc-900">
            <div className="text-xs text-zinc-500">{label}</div>
            <div className="text-lg font-bold">{value}</div>
          </div>
        ))}
      </div>

      <figure aria-label="요일별 공부 시간">
        <div className="flex h-36 items-end gap-2">
          {w.days.map((d, i) => (
            <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] text-zinc-500">{d.minutes || ""}</span>
              <div className="w-full rounded-t-md bg-indigo-500" style={{ height: `${(d.minutes / maxDay) * 100}%`, minHeight: d.minutes ? 4 : 0 }} title={`${DOW[i]} ${hm(d.minutes)}`} />
              <span className="text-xs text-zinc-500">{DOW[i]}</span>
            </div>
          ))}
        </div>
        <figcaption className="mt-1 text-center text-xs text-zinc-500">요일별 공부 시간 (분)</figcaption>
      </figure>

      <div className="flex flex-col gap-1">
        <div className="text-sm font-semibold">과목별</div>
        {!w.subjects.length && <p className="text-sm text-zinc-500">타이머로 공부하면 과목별 시간이 보여요.</p>}
        {w.subjects.map((s) => (
          <div key={s.subject} className="flex items-center gap-2 text-sm">
            <span className="w-14 shrink-0 truncate">{s.subject}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${(s.minutes / maxSub) * 100}%` }} />
            </div>
            <span className="w-20 shrink-0 text-right text-xs text-zinc-500">{hm(s.minutes)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
