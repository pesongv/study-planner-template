"use client";
import { useState } from "react";
import { api } from "@/lib/client";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const res = await api<{ role: string; must_change_pw: boolean }>("/api/auth/login", {
      student_id: f.get("student_id"),
      password: f.get("password"),
    });
    setBusy(false);
    if (res.error) return setError(res.error);
    location.assign(res.must_change_pw ? "/change-password" : res.role === "teacher" ? "/teacher" : "/");
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">📚 우리 반 독서실</h1>
        <p className="mt-1 text-zinc-500">학번과 비밀번호로 들어와요</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="student_id" placeholder="학번 (예: 10701)" autoComplete="username" required className="input" />
        <input name="password" type="password" placeholder="비밀번호" autoComplete="current-password" required className="input" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button disabled={busy} className="btn">{busy ? "들어가는 중…" : "입실하기"}</button>
      </form>
      <p className="text-center text-sm text-zinc-500">비밀번호를 잊었다면 선생님께 말해 주세요 🙂</p>
    </main>
  );
}
