"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { Desk } from "./Desk";
import { Character } from "./Character";

type Seat = { seat_no: number; name: string; character: string; present: boolean; student_id?: string };
type Stat = { student_id: string; certified: boolean; todayMinutes: number; monthStars: number };

/** 선생님 화면의 독서실. 학생이 배정된 책상을 누르면 빠른 창(응원 보내기·상세 보기). 20초마다 새로고침 */
export function RoomView() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [picked, setPicked] = useState<Seat>();

  useEffect(() => {
    const load = () => api<{ seats: Seat[] }>("/api/room").then((r) => r.seats && setSeats(r.seats));
    load();
    const t = setInterval(() => document.hidden || load(), 20_000);
    return () => clearInterval(t);
  }, []);

  const bySeat = new Map(seats.map((s) => [s.seat_no, s]));
  const count = Math.max(25, ...seats.map((s) => s.seat_no));
  return (
    <section className="flex flex-col gap-2 print:hidden">
      <h2 className="font-semibold">
        🏫 지금 독서실 <span className="text-sm font-normal text-zinc-500">{seats.filter((s) => s.present).length}명 공부 중 · 책상을 누르면 응원·상세 보기</span>
      </h2>
      <div className="rounded-2xl bg-amber-50 p-3 dark:bg-stone-900">
        <div className="grid grid-cols-5 gap-x-2 gap-y-1">
          {Array.from({ length: count }, (_, i) => i + 1).map((no) => {
            const s = bySeat.get(no);
            const desk = <Desk no={no} name={s?.name} character={s?.character} seated={!!s?.present} me={false} />;
            return s?.student_id ? (
              <button key={no} onClick={() => setPicked(s)} aria-label={`${s.name} (${no}번 자리) 열기`} className="rounded-md transition active:scale-95">
                {desk}
              </button>
            ) : (
              <div key={no}>{desk}</div>
            );
          })}
        </div>
      </div>
      {picked && <QuickPanel seat={picked} onClose={() => setPicked(undefined)} />}
    </section>
  );
}

/** 책상을 눌렀을 때: 오늘 상태 + 응원 보내기 + 상세 보기 */
function QuickPanel({ seat, onClose }: { seat: Seat; onClose: () => void }) {
  const [stat, setStat] = useState<Stat>();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<Stat[]>("/api/teacher/students").then((r) => Array.isArray(r) && setStat(r.find((x) => x.student_id === seat.student_id)));
  }, [seat.student_id]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const res = await api("/api/teacher/message", { student_id: seat.student_id, text });
    setMsg(res.error ?? "보냈어요! 학생이 앱을 열면 팝업으로 보여요 💌");
    if (!res.error) setText("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={`${seat.name} 빠른 창`} onClick={onClose}>
      <div className="animate-cheer-in flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          {seat.character && <Character id={seat.character} size={48} />}
          <div className="flex-1">
            <div className="text-lg font-bold">{seat.name} <span className="text-sm font-normal text-zinc-500">{seat.seat_no}번 자리</span></div>
            <div className={`text-sm ${seat.present ? "font-semibold text-emerald-600" : "text-zinc-500"}`}>{seat.present ? "🟢 지금 공부 중" : "⚪ 자리에 없음"}</div>
          </div>
          <button onClick={onClose} className="min-h-11 px-2 text-zinc-400" aria-label="닫기">✕</button>
        </div>
        {stat && (
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-zinc-50 p-2 dark:bg-zinc-800"><div className="text-xs text-zinc-500">오늘 인증</div>{stat.certified ? "🏅 완료" : "전"}</div>
            <div className="rounded-xl bg-zinc-50 p-2 dark:bg-zinc-800"><div className="text-xs text-zinc-500">오늘 공부</div>{stat.todayMinutes}분</div>
            <div className="rounded-xl bg-zinc-50 p-2 dark:bg-zinc-800"><div className="text-xs text-zinc-500">이번 달</div>⭐ {stat.monthStars}</div>
          </div>
        )}
        <form onSubmit={send} className="flex gap-2">
          <input value={text} onChange={(e) => { setText(e.target.value); setMsg(""); }} required maxLength={200} placeholder="💌 응원 한마디" className="input" />
          <button className="btn shrink-0">보내기</button>
        </form>
        {msg && <p className="text-sm">{msg}</p>}
        <Link href={`/teacher/student/${seat.student_id}`} className="min-h-11 content-center rounded-xl border text-center text-sm font-semibold">📋 상세 보기 (계획·낸 문제·기록)</Link>
      </div>
    </div>
  );
}
