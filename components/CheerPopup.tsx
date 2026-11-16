"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Msg = { text: string; sent: string; unread: boolean };

/** 선생님이 보낸 안 읽은 응원 메시지를 앱을 열 때 팝업으로 */
export function CheerPopup() {
  const [msgs, setMsgs] = useState<Msg[]>([]);

  useEffect(() => {
    api<Msg[]>("/api/messages").then((r) => Array.isArray(r) && setMsgs(r.filter((m) => m.unread)));
  }, []);

  if (!msgs.length) return null;
  async function close() {
    setMsgs([]);
    await api("/api/messages", {});
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="선생님의 응원 메시지">
      <div className="animate-cheer-in flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900">
        <h2 className="text-center text-lg font-bold">💌 선생님의 응원 메시지</h2>
        <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {msgs.map((m, i) => (
            <li key={i} className="rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              {m.text}
              <div className="mt-1 text-right text-[11px] opacity-60">{m.sent.slice(5, 16).replace("-", "/")}</div>
            </li>
          ))}
        </ul>
        <button onClick={close} className="btn">고마워요! 💪</button>
      </div>
    </div>
  );
}
