"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Character } from "@/components/Character";
import { Desk } from "@/components/Desk";
import { Timer } from "@/components/Timer";
import { Ranking } from "@/components/Ranking";
import { TodayCert } from "@/components/TodayCert";
import { ClassBanner } from "@/components/ClassBanner";
import { CheerPopup } from "@/components/CheerPopup";
import { Achievements } from "@/components/Achievements";
import { api, logout } from "@/lib/client";

type Seat = { seat_no: number; name: string; character: string; present: boolean; me: boolean };
type Phase = "out" | "walking-in" | "in" | "walking-out";

const DESKS = 25;
const NAV = "relative flex min-h-14 flex-col items-center justify-center whitespace-nowrap rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";
const POLL_MS = 20_000;
const WALK_MS = 1200;

export default function RoomPage() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [phase, setPhase] = useState<Phase>("out");
  const [walker, setWalker] = useState<{ x: number; y: number }>();
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState(false); // 선생님이 테스트 계정으로 미리보기 중
  const [certKey, setCertKey] = useState(0); // 타이머가 끝나면 인증 카드 새로고침
  const bumpCert = useCallback(() => setCertKey((k) => k + 1), []);
  const room = useRef<HTMLDivElement>(null);
  const door = useRef<HTMLDivElement>(null);
  const myDesk = useRef<HTMLDivElement>(null);

  const mine = seats.find((s) => s.me);

  const load = useCallback(
    () =>
      api<{ seats: Seat[] }>("/api/room").then((res) => {
        if (!res.seats) return;
        setSeats(res.seats);
        // 걷는 중이 아닐 때만 서버 상태로 맞춤
        setPhase((p) => (p === "walking-in" || p === "walking-out" ? p : res.seats.find((s) => s.me)?.present ? "in" : "out"));
      }),
    [],
  );

  useEffect(() => {
    api<{ character: string; preview: boolean }>("/api/me").then((me) => {
      setPreview(!!me.preview);
      if (me.character === "") location.assign("/character");
    });
    load();
    const t = setInterval(() => document.hidden || load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  /** 요소 가운데 좌표 (독서실 기준) */
  const center = (el: HTMLElement | null) => {
    const r = el!.getBoundingClientRect();
    const base = room.current!.getBoundingClientRect();
    return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
  };

  /** from → to 로 캐릭터를 걷게 하고, 도착하면 onArrive */
  function walk(from: HTMLElement | null, to: HTMLElement | null, onArrive: () => void) {
    setWalker(center(from));
    requestAnimationFrame(() => requestAnimationFrame(() => setWalker(center(to))));
    setTimeout(onArrive, WALK_MS);
  }

  function checkIn() {
    setMsg("");
    setPhase("walking-in");
    walk(door.current, myDesk.current, async () => {
      const res = await api("/api/attendance/check-in", {});
      setWalker(undefined);
      if (res.error) {
        setPhase("out");
        return setMsg(res.error);
      }
      setPhase("in");
      setMsg("자리에 앉았어요. 오늘도 화이팅! 💪");
      load();
    });
  }

  async function checkOut() {
    setMsg("");
    setPhase("walking-out");
    const res = await api("/api/attendance/check-out", {});
    if (res.error) {
      setPhase("in");
      return setMsg(res.error);
    }
    walk(myDesk.current, door.current, () => {
      setWalker(undefined);
      setPhase("out");
      setMsg("수고했어요! 다음에 또 만나요 👋");
      load();
    });
  }

  const deskCount = Math.max(DESKS, ...seats.map((s) => s.seat_no));
  const bySeat = new Map(seats.map((s) => [s.seat_no, s]));
  const presentCount = seats.filter((s) => (s.me ? phase === "in" : s.present)).length;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 p-4 md:max-w-4xl">
      {/* 1줄: 제목 + 도움말·로그아웃 / 2줄: 메뉴 버튼 5개 (폰에서도 글자가 안 깨지게 같은 폭) */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold">📚 우리 반 독서실</h1>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <Link href="/help" className="inline-flex min-h-11 items-center whitespace-nowrap underline">❓도움말</Link>
            <button onClick={logout} className="inline-flex min-h-11 items-center whitespace-nowrap underline">로그아웃</button>
          </div>
        </div>
        <nav className="grid grid-cols-5 gap-1.5 md:max-w-xl">
          <Link href="/plan" className={NAV}><span className="text-lg">📅</span>계획</Link>
          <Link href="/journal" className={NAV}><span className="text-lg">✍️</span>한줄평</Link>
          <Link href="/report" className={NAV}><span className="text-lg">📊</span>리포트</Link>
          <Link href="/character" className={NAV}><span className="text-lg">🐱</span>캐릭터</Link>
          <CheerPopup autoOpen={!preview} className={NAV} />
        </nav>
      </header>
      {preview && (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm text-white">
          <span>🧪 학생 화면 미리보기 중 (테스트 계정)</span>
          <button onClick={() => api("/api/preview/end", {}).then(() => location.assign("/teacher"))} className="min-h-11 rounded-lg bg-white px-3 font-semibold text-indigo-700">
            선생님 화면으로
          </button>
        </div>
      )}
      <ClassBanner />

      {/* 넓은 화면: 왼쪽 독서실 / 오른쪽 타이머. 폰: 위아래 */}
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500">지금 {presentCount}명이 공부하고 있어요</p>

          <div ref={room} className="relative rounded-2xl bg-amber-50 p-3 dark:bg-stone-900">
            <div className="grid grid-cols-5 gap-x-2 gap-y-1">
              {Array.from({ length: deskCount }, (_, i) => i + 1).map((no) => {
                const s = bySeat.get(no);
                const seated = s && (s.me ? phase === "in" : s.present);
                return (
                  <div key={no} ref={s?.me ? myDesk : undefined}>
                    <Desk no={no} name={s?.name} character={s?.character} seated={!!seated} me={!!s?.me} />
                  </div>
                );
              })}
            </div>

            <div ref={door} className="mx-auto mt-3 flex h-8 w-16 items-center justify-center rounded-t-lg bg-stone-400 text-[10px] text-white">
              입구
            </div>

            {walker && mine && (
              <div
                className="pointer-events-none absolute left-0 top-0"
                style={{
                  transform: `translate(${walker.x - 16}px, ${walker.y - 16}px)`,
                  transition: `transform ${WALK_MS}ms ease-in-out`,
                }}
              >
                <Character id={mine.character} size={32} className="animate-bounce" />
              </div>
            )}
          </div>

          {msg && <p className="text-center text-sm">{msg}</p>}

          {mine ? (
            phase === "in" ? (
              <button onClick={checkOut} className="btn bg-zinc-600">퇴실하기</button>
            ) : (
              <button onClick={checkIn} disabled={phase !== "out"} className="btn">
                {phase === "out" ? `${mine.seat_no}번 자리에 앉기` : "이동 중…"}
              </button>
            )
          ) : (
            <p className="text-center text-sm text-zinc-500">자리 정보를 불러오는 중이에요…</p>
          )}
        </div>
        {mine && (
          <div className="flex flex-col gap-4">
            <TodayCert key={`cert-${certKey}`} />
            <Timer onFinish={bumpCert} />
            <Achievements key={`ach-${certKey}`} />
            <Ranking />
          </div>
        )}
      </div>
    </main>
  );
}
