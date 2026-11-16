"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RoomView } from "@/components/RoomView";
import { api, logout } from "@/lib/client";

type Student = { student_id: string; name: string; seat_no: string; must_change_pw: boolean; todayMinutes: number; monthStars: number; totalStars: number; certified: boolean };
type Issued = { student_id: string; name: string; password: string };

/** 엑셀 CSV는 EUC-KR일 수 있어서 UTF-8 실패 시 EUC-KR로 다시 읽음. 학번이 숫자가 아닌 줄(헤더 등)은 건너뜀. */
async function parseCsv(file: File) {
  const buf = await file.arrayBuffer();
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    text = new TextDecoder("euc-kr").decode(buf);
  }
  return text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((line) => line.split(/[,\t]/).map((c) => c.trim().replace(/^"|"$/g, "")))
    .filter(([id, name]) => /^\d{4,6}$/.test(id ?? "") && name)
    .map(([student_id, name]) => ({ student_id, name }));
}

export default function TeacherPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [issued, setIssued] = useState<Issued[]>([]);
  const [msg, setMsg] = useState("");
  const [rankBy, setRankBy] = useState<"monthStars" | "totalStars">("monthStars");

  const load = useCallback(() => api<Student[]>("/api/teacher/students").then((r) => Array.isArray(r) && setStudents(r)), []);
  useEffect(() => {
    load();
  }, [load]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const list = await parseCsv(file);
    if (!list.length) return setMsg("명단을 읽지 못했어요. '학번,이름' 형식인지 확인해 주세요.");
    setMsg(`${list.length}명 등록 중…`);
    const res = await api<{ created: Issued[]; skipped: number }>("/api/teacher/students", { students: list });
    if (res.error) return setMsg(res.error);
    setIssued(res.created);
    setMsg(`${res.created.length}명 등록했어요.` + (res.skipped ? ` (이미 있는 학번 ${res.skipped}명은 건너뜀)` : ""));
    load();
  }

  async function reset(s: Student) {
    if (!confirm(`${s.name}(${s.student_id}) 비밀번호를 초기화할까요?`)) return;
    const res = await api<Issued>("/api/teacher/reset-password", { student_id: s.student_id });
    if (res.error) return setMsg(res.error);
    setIssued([res]);
    setMsg(`${res.name} 비밀번호를 초기화했어요.`);
    load();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
      <header className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold">👩‍🏫 선생님 화면</h1>
        <button onClick={logout} className="text-sm text-zinc-500 underline">로그아웃</button>
      </header>

      <RoomView />

      <ClassSettings />

      <section className="flex flex-col gap-2 print:hidden">
        <h2 className="font-semibold">학생 일괄 등록</h2>
        <p className="text-sm text-zinc-500">CSV 파일 (한 줄에 <code>학번,이름</code>). 첫 줄 제목은 있어도 괜찮아요.</p>
        <label className="btn cursor-pointer text-center">
          CSV 파일 선택
          <input type="file" accept=".csv,text/csv" onChange={onUpload} className="hidden" />
        </label>
        {msg && <p className="text-sm">{msg}</p>}
      </section>

      {issued.length > 0 && (
        <section className="flex flex-col gap-2 rounded-lg border-2 border-amber-400 p-3">
          <div className="flex items-center justify-between print:hidden">
            <h2 className="font-semibold">임시 비밀번호 (이 화면을 벗어나면 다시 볼 수 없어요)</h2>
            <button onClick={() => print()} className="btn !min-h-0 px-3 py-1 text-sm">인쇄</button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {issued.map((s) => (
              <div key={s.student_id} className="rounded border border-dashed p-2 text-sm">
                {s.name} ({s.student_id}) — 임시 비밀번호: <b className="font-mono text-base">{s.password}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2 print:hidden">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">⭐ 별 순위</h2>
          <div className="flex gap-1 text-sm">
            {(["monthStars", "totalStars"] as const).map((k) => (
              <button key={k} onClick={() => setRankBy(k)} aria-pressed={rankBy === k}
                className={`min-h-11 rounded-lg px-3 ${rankBy === k ? "bg-amber-100 font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200" : "text-zinc-500"}`}>
                {k === "monthStars" ? "이번 달" : "전체"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-zinc-500">오늘 인증 완료 = ⭐1, 타이머 25분 = ⭐1. 학생 화면에는 이번 달 TOP 5만 (이름 가림) 보여요.</p>
        <ol className="flex flex-col gap-1">
          {[...students].filter((s) => s[rankBy] > 0).sort((a, b) => b[rankBy] - a[rankBy]).slice(0, 10).map((s, i) => (
            <li key={s.student_id} className="flex items-center gap-3 rounded-lg px-2 py-1 odd:bg-zinc-50 dark:odd:bg-zinc-900">
              <span className="w-8 text-center font-bold">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
              <span className="flex-1">{s.name} <span className="text-xs text-zinc-500">{s.student_id}</span></span>
              <b className="text-amber-500">⭐ {s[rankBy]}</b>
            </li>
          ))}
        </ol>
        {!students.some((s) => s[rankBy] > 0) && <p className="text-sm text-zinc-500">아직 별을 받은 학생이 없어요.</p>}
      </section>

      <section className="flex flex-col gap-2 print:hidden">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">우리 반 학생 ({students.length}명)</h2>
          <a href="/api/teacher/export.csv" download className="min-h-11 content-center rounded-lg border px-3 text-sm">📥 이번 달 기록 CSV</a>
        </div>
        <p className="text-xs text-zinc-500">이름을 누르면 학생별 자세한 기록을 볼 수 있어요.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-zinc-500">
              <tr><th className="py-2">자리</th><th>학번</th><th>이름</th><th>오늘 인증</th><th>오늘 공부</th><th>이번 달 ⭐</th><th>비밀번호</th><th></th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.student_id} className="border-t">
                  <td className="py-2">{s.seat_no}</td>
                  <td>{s.student_id}</td>
                  <td><Link href={`/teacher/student/${s.student_id}`} className="text-indigo-600 underline">{s.name}</Link></td>
                  <td>{s.certified ? "🏅" : "-"}</td>
                  <td>{s.todayMinutes ? `${s.todayMinutes}분` : "-"}</td>
                  <td>{s.monthStars || "-"}</td>
                  <td>{s.must_change_pw ? "아직 안 바꿈" : "변경 완료"}</td>
                  <td className="text-right">
                    <button onClick={() => reset(s)} className="min-h-11 px-2 text-rose-600 underline">초기화</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

/** 응원 메시지 · 학급 공동 목표 */
function ClassSettings() {
  const [cheer, setCheer] = useState("");
  const [hours, setHours] = useState("");
  const [info, setInfo] = useState<{ minutes: number; goalSince: string }>();
  const [msg, setMsg] = useState("");

  const load = useCallback(
    () =>
      api<{ cheer: string; goalHours: number; minutes: number; goalSince: string }>("/api/class").then((c) => {
        if (c.error) return;
        setCheer(c.cheer);
        setHours(c.goalHours ? String(c.goalHours) : "");
        setInfo(c);
      }),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);

  async function save(body: object, done: string) {
    const res = await api("/api/teacher/settings", body);
    setMsg(res.error ?? done);
    if (!res.error) load();
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-3 print:hidden dark:border-zinc-800">
      <h2 className="font-semibold">📣 응원 메시지 · 🎯 학급 목표</h2>
      <div className="flex gap-2">
        <input value={cheer} onChange={(e) => setCheer(e.target.value)} maxLength={100} placeholder="학생 화면 맨 위에 보일 한마디 (비우면 숨김)" className="input" />
        <button onClick={() => save({ cheer }, "응원 메시지를 바꿨어요.")} className="btn shrink-0">저장</button>
      </div>
      <div className="flex items-center gap-2">
        <input value={hours} onChange={(e) => setHours(e.target.value)} type="number" min={0} placeholder="예: 100" className="input w-32" />
        <span className="text-sm">시간</span>
        <button onClick={() => save({ goal_hours: Number(hours) || 0 }, "학급 목표를 정했어요. 오늘부터 다시 모아요!")} className="btn shrink-0">새 목표로 시작</button>
      </div>
      {info && Number(hours) > 0 && (
        <p className="text-xs text-zinc-500">{info.goalSince}부터 지금까지 우리 반 {Math.floor(info.minutes / 60)}시간 {info.minutes % 60}분 모았어요. 0으로 저장하면 목표를 숨겨요.</p>
      )}
      {msg && <p className="text-sm">{msg}</p>}
    </section>
  );
}
