"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Desk } from "./Desk";

type Seat = { seat_no: number; name: string; character: string; present: boolean };

/** 보기 전용 독서실 (선생님 화면). 20초마다 새로고침 */
export function RoomView() {
  const [seats, setSeats] = useState<Seat[]>([]);

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
      <h2 className="font-semibold">🏫 지금 독서실 <span className="text-sm font-normal text-zinc-500">{seats.filter((s) => s.present).length}명 공부 중</span></h2>
      <div className="rounded-2xl bg-amber-50 p-3 dark:bg-stone-900">
        <div className="grid grid-cols-5 gap-x-2 gap-y-1">
          {Array.from({ length: count }, (_, i) => i + 1).map((no) => {
            const s = bySeat.get(no);
            return <Desk key={no} no={no} name={s?.name} character={s?.character} seated={!!s?.present} me={false} />;
          })}
        </div>
      </div>
    </section>
  );
}
