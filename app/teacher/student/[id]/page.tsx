"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/client";
import { Character } from "@/components/Character";
import { WeekChart, type WeekData } from "@/components/WeekChart";

type Detail = {
  student: { student_id: string; name: string; seat_no: string; character: string };
  stars: { month: number; total: number };
  streak: number;
  last14: { date: string; minutes: number; cert: boolean }[];
  todayGoals: { title: string; done: boolean }[];
  week: WeekData & { review: string };
  reflections: { date: string; learned: string; mood: string }[];
  wrong: { subject: string; question: string; answer: string }[];
};
const short = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`;

// 주소의 학번은 요청 때만 알 수 있어서 Suspense 안에서 읽음
export default function StudentDetailPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-zinc-500">불러오는 중이에요…</p>}>
      <StudentDetail />
    </Suspense>
  );
}

function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<Detail>();
  const [error, setError] = useState("");

  useEffect(() => {
    api<Detail>(`/api/teacher/student/${id}`).then((r) => (r.error ? setError(r.error) : setD(r)));
  }, [id]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
      <Link href="/teacher" className="text-sm text-zinc-500 underline">← 선생님 화면</Link>
      {error && <p className="text-rose-600">{error}</p>}
      {d && (
        <>
          <header className="flex items-center gap-3">
            {d.student.character && <Character id={d.student.character} size={48} />}
            <div>
              <h1 className="text-xl font-bold">{d.student.name} <span className="text-sm font-normal text-zinc-500">{d.student.student_id} · {d.student.seat_no}번 자리</span></h1>
              <p className="text-sm">⭐ 이번 달 {d.stars.month} · 전체 {d.stars.total} · 🔥 {d.streak}일 연속</p>
            </div>
          </header>

          <section className="flex flex-col gap-2">
            <h2 className="font-semibold">최근 14일</h2>
            <div className="grid grid-cols-7 gap-1 text-center text-xs sm:grid-cols-14">
              {d.last14.map((x) => (
                <div key={x.date} className={`rounded-lg p-1 ${x.cert ? "bg-emerald-100 dark:bg-emerald-950" : "bg-zinc-50 dark:bg-zinc-900"}`}>
                  <div className="text-zinc-500">{short(x.date)}</div>
                  <div className="font-semibold">{x.minutes ? `${x.minutes}분` : "-"}</div>
                  <div>{x.cert ? "🏅" : ""}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="font-semibold">이번 주</h2>
              <WeekChart w={d.week} />
              {d.week.review && <p className="rounded-lg bg-zinc-50 p-2 text-sm dark:bg-zinc-900">🗒️ {d.week.review}</p>}
            </section>
            <div className="flex flex-col gap-4">
              <section className="flex flex-col gap-1 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <h2 className="font-semibold">오늘 할 일</h2>
                {!d.todayGoals.length && <p className="text-sm text-zinc-500">없음</p>}
                {d.todayGoals.map((g, i) => <p key={i} className="text-sm">{g.done ? "✅" : "⬜"} {g.title}</p>)}
              </section>
              <section className="flex flex-col gap-1 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <h2 className="font-semibold">최근 회고</h2>
                {!d.reflections.length && <p className="text-sm text-zinc-500">없음</p>}
                {d.reflections.map((r, i) => <p key={i} className="text-sm"><span className="text-zinc-500">{short(r.date)}</span> {r.mood} {r.learned}</p>)}
              </section>
              <section className="flex flex-col gap-1 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <h2 className="font-semibold">오답노트 ({d.wrong.length})</h2>
                {!d.wrong.length && <p className="text-sm text-zinc-500">없음</p>}
                {d.wrong.map((q, i) => <p key={i} className="text-sm">{q.subject && `[${q.subject}] `}{q.question} <span className="text-zinc-500">→ {q.answer}</span></p>)}
              </section>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
