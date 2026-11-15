"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { addDays } from "@/lib/goals";
import { WeekChart, type WeekData } from "@/components/WeekChart";

type Report = WeekData & { review: string };
const short = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`;

export default function ReportPage() {
  const [r, setR] = useState<Report>();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(
    (week = "") =>
      api<Report>(`/api/stats/weekly${week ? `?week=${week}` : ""}`).then((res) => {
        if (res.error) return;
        setR(res);
        setText(res.review);
        setMsg("");
      }),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!r) return;
    const res = await api("/api/stats/weekly", { week: r.monday, text });
    setMsg(res.error ?? "저장했어요 ✓");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4 md:max-w-4xl">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold">📊 주간 리포트</h1>
        <Link href="/" className="inline-flex min-h-11 items-center text-sm text-zinc-500 underline">독서실로</Link>
      </header>
      {!r ? (
        <p className="text-center text-sm text-zinc-500">불러오는 중이에요…</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button onClick={() => load(addDays(r.monday, -7))} className="min-h-11 px-3" aria-label="지난주">◀</button>
            <span className="font-semibold">{short(r.monday)} ~ {short(addDays(r.monday, 6))}</span>
            <button onClick={() => load(addDays(r.monday, 7))} className="min-h-11 px-3" aria-label="다음 주">▶</button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 md:items-start">
            <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <WeekChart w={r} />
            </section>
            <form onSubmit={save} className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="font-semibold">🗒️ 이번 주 돌아보기</h2>
              <textarea value={text} onChange={(e) => { setText(e.target.value); setMsg(""); }} rows={4} maxLength={500}
                placeholder="잘한 점 하나, 다음 주에 바꿔 볼 점 하나 (예: 수학을 매일 했다! 다음 주엔 영어도 해 보기)" className="input py-2" />
              {msg && <p className="text-sm">{msg}</p>}
              <button disabled={!text.trim()} className="btn">저장하기</button>
            </form>
          </div>
        </>
      )}
    </main>
  );
}
