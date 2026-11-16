"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
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
  plans: {
    months: { title: string; subject: string; ranges: string; progress: number }[];
    weeks: { title: string; amount: string; progress: number }[];
    upcoming: { date: string; title: string }[];
    ddays: { title: string; date: string }[];
  };
  quizzes: { date: string; subject: string; question: string; answer: string; type: string; result: string }[];
  messages: { text: string; sent: string; read: boolean }[];
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

  const load = useCallback(() => api<Detail>(`/api/teacher/student/${id}`).then((r) => (r.error ? setError(r.error) : setD(r))), [id]);
  useEffect(() => {
    load();
  }, [load]);

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

          <SendCheer id={d.student.student_id} name={d.student.name} sent={d.messages} onSent={load} />

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

          <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-semibold">📅 계획</h2>
            {d.plans.ddays.length > 0 && <p className="text-sm">🎯 {d.plans.ddays.map((x) => `${x.title} ${short(x.date)}`).join(" · ")}</p>}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-zinc-500">월 목표</h3>
                {!d.plans.months.length && <p className="text-sm text-zinc-500">없음</p>}
                {d.plans.months.map((m, i) => (
                  <div key={i} className="text-sm">
                    {m.subject && <span className="text-zinc-500">[{m.subject}] </span>}{m.title}
                    {m.ranges && <div className="text-xs text-zinc-500">{m.ranges}</div>}
                    <Progress value={m.progress} />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-zinc-500">이번 주 목표</h3>
                {!d.plans.weeks.length && <p className="text-sm text-zinc-500">없음</p>}
                {d.plans.weeks.map((w, i) => (
                  <div key={i} className="text-sm">{w.title} <span className="text-xs text-zinc-500">{w.amount}</span><Progress value={w.progress} /></div>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-zinc-500">앞으로 7일 할 일</h3>
                {!d.plans.upcoming.length && <p className="text-sm text-zinc-500">없음</p>}
                {d.plans.upcoming.map((u, i) => <p key={i} className="text-sm"><span className="text-zinc-500">{short(u.date)}</span> {u.title}</p>)}
              </div>
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
                <h2 className="font-semibold">최근 한 줄 평</h2>
                {!d.reflections.length && <p className="text-sm text-zinc-500">없음</p>}
                {d.reflections.map((r, i) => <p key={i} className="text-sm"><span className="text-zinc-500">{short(r.date)}</span> {r.mood} {r.learned}</p>)}
              </section>
              <section className="flex flex-col gap-1 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <h2 className="font-semibold">❓ 낸 문제 ({d.quizzes.length}) <span className="text-sm font-normal text-zinc-500">오답 {d.wrong.length}</span></h2>
                {!d.quizzes.length && <p className="text-sm text-zinc-500">없음</p>}
                <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                  {d.quizzes.map((q, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-zinc-500">{short(q.date)}</span> {q.subject && `[${q.subject}] `}{q.question}
                      <span className="text-zinc-500"> → {q.answer}</span>{" "}
                      <span className={q.result === "정답" ? "text-emerald-600" : q.result === "오답" ? "text-rose-600" : "text-zinc-400"}>
                        {q.result === "정답" ? "⭕" : q.result === "오답" ? "❌" : "⏳ 풀기 전"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function Progress({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} /></div>
      <span className="w-8 text-right text-[11px] text-zinc-500">{pct}%</span>
    </div>
  );
}

/** 이 학생에게 응원 메시지 보내기 (학생이 앱을 열면 팝업) */
function SendCheer({ id, name, sent, onSent }: { id: string; name: string; sent: Detail["messages"]; onSent: () => void }) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const res = await api("/api/teacher/message", { student_id: id, text });
    setMsg(res.error ?? "보냈어요! 학생이 앱을 열면 팝업으로 보여요 💌");
    if (!res.error) {
      setText("");
      onSent();
    }
  }
  return (
    <section className="flex flex-col gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
      <h2 className="font-semibold">💌 {name}에게 응원 보내기</h2>
      <form onSubmit={send} className="flex gap-2">
        <input value={text} onChange={(e) => { setText(e.target.value); setMsg(""); }} maxLength={200} required
          placeholder="예: 이번 주 매일 인증했네! 정말 멋져 👍" className="input bg-white dark:bg-zinc-900" />
        <button className="btn shrink-0">보내기</button>
      </form>
      {msg && <p className="text-sm">{msg}</p>}
      {sent.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {sent.slice(0, 5).map((m, i) => (
            <li key={i}><span className="text-zinc-500">{m.sent.slice(5, 16).replace("-", "/")}</span> {m.text} <span className="text-xs text-zinc-500">{m.read ? "✓ 읽음" : "안 읽음"}</span></li>
          ))}
        </ul>
      )}
    </section>
  );
}
