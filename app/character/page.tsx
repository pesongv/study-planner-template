"use client";
import { useEffect, useState } from "react";
import { Character } from "@/components/Character";
import { CHARACTERS } from "@/lib/characters";
import { api } from "@/lib/client";

export default function CharacterPage() {
  const [picked, setPicked] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ character: string }>("/api/me").then((me) => setPicked(me.character ?? ""));
  }, []);

  async function save() {
    setBusy(true);
    const res = await api("/api/me/character", { character: picked }, "PATCH");
    setBusy(false);
    if (res.error) return setError(res.error);
    location.assign("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-5 p-4">
      <div className="text-center">
        <h1 className="text-xl font-bold">나의 캐릭터 고르기</h1>
        <p className="mt-1 text-sm text-zinc-500">독서실에서 내 자리에 앉을 친구예요. 나중에 바꿀 수 있어요.</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            onClick={() => setPicked(c.id)}
            aria-pressed={picked === c.id}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-xs transition ${
              picked === c.id ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950" : "border-transparent"
            }`}
          >
            <Character id={c.id} size={48} />
            {c.name}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button onClick={save} disabled={!picked || busy} className="btn">
        {busy ? "저장 중…" : "이 친구로 할래요"}
      </button>
    </main>
  );
}
