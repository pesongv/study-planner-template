"use client";
import { useState } from "react";
import { api, logout } from "@/lib/client";

export default function ChangePasswordPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("next") !== f.get("confirm")) return setError("새 비밀번호 두 칸이 서로 달라요.");
    setBusy(true);
    const res = await api<{ role: string }>("/api/auth/change-password", { current: f.get("current"), next: f.get("next") });
    setBusy(false);
    if (res.error) return setError(res.error);
    location.assign(res.role === "teacher" ? "/teacher" : "/");
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">🔑 나만의 비밀번호 만들기</h1>
        <p className="mt-1 text-zinc-500">처음 받은 비밀번호를 내 것으로 바꿔요</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="current" type="password" placeholder="지금 비밀번호" autoComplete="current-password" required className="input" />
        <input name="next" type="password" placeholder="새 비밀번호 (6자 이상)" autoComplete="new-password" minLength={6} required className="input" />
        <input name="confirm" type="password" placeholder="새 비밀번호 한 번 더" autoComplete="new-password" minLength={6} required className="input" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button disabled={busy} className="btn">{busy ? "바꾸는 중…" : "바꾸기"}</button>
      </form>
      <button onClick={logout} className="text-sm text-zinc-500 underline">로그아웃</button>
    </main>
  );
}
