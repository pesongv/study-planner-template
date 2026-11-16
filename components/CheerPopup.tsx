"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Msg = { text: string; sent: string; unread: boolean };

/** 💌 응원함 버튼 + 메시지 창. 안 읽은 응원이 있으면 앱을 열 때 자동으로 열림 (autoOpen) */
export function CheerPopup({ autoOpen = true }: { autoOpen?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api<Msg[]>("/api/messages").then((r) => {
      if (!Array.isArray(r)) return;
      setMsgs(r);
      if (autoOpen && r.some((m) => m.unread)) setOpen(true);
    });
  }, [autoOpen]);

  const unread = msgs.filter((m) => m.unread).length;
  async function close() {
    setOpen(false);
    if (!unread) return;
    setMsgs(msgs.map((m) => ({ ...m, unread: false })));
    await api("/api/messages", {});
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative inline-flex min-h-11 items-center text-zinc-500 underline" aria-label={`받은 응원${unread ? ` (안 읽음 ${unread}개)` : ""}`}>
        💌응원함
        {unread > 0 && <span className="absolute -right-2 top-1.5 size-2.5 rounded-full bg-rose-500" />}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="선생님의 응원 메시지">
          <div className="animate-cheer-in flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white p-5 text-left text-base no-underline shadow-xl dark:bg-zinc-900">
            <h2 className="text-center text-lg font-bold text-zinc-900 dark:text-zinc-100">💌 선생님의 응원 메시지</h2>
            {!msgs.length && <p className="text-center text-sm text-zinc-500">아직 받은 응원이 없어요. 오늘도 화이팅!</p>}
            <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {msgs.map((m, i) => (
                <li key={i} className={`rounded-xl p-3 ${m.unread ? "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-50" : "bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"}`}>
                  {m.unread && <span className="mr-1 text-xs font-bold text-rose-500">NEW</span>}
                  {m.text}
                  <div className="mt-1 text-right text-[11px] opacity-60">{m.sent.slice(5, 16).replace("-", "/")}</div>
                </li>
              ))}
            </ul>
            <button onClick={close} className="btn">{unread ? "고마워요! 💪" : "닫기"}</button>
          </div>
        </div>
      )}
    </>
  );
}
