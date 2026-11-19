"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { MOODS, QUIZ_PER_DAY } from "@/lib/journal";

type QuizView = { quiz_id: string; date: string; subject: string; question: string; type: "short" | "ox" | "choice"; choices: string[]; answer?: string };
type Quizzes = { made: QuizView[]; toSolve: QuizView[]; wrong: QuizView[] };

export default function JournalPage() {
  const [quizzes, setQuizzes] = useState<Quizzes>();
  const reload = useCallback(() => api<Quizzes>("/api/quizzes").then((q) => !q.error && setQuizzes(q)), []);
  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4 md:max-w-4xl">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold">✍️ 한 줄 평·퀴즈</h1>
        <Link href="/" className="inline-flex min-h-11 items-center text-sm text-zinc-500 underline">독서실로</Link>
      </header>

      {/* 넓은 화면: 왼쪽 한 줄 평·풀기 / 오른쪽 문제 내기·오답노트. 폰: 위아래 */}
      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-5">
          <Reflection />
          {quizzes && <Solve list={quizzes.toSolve} title="📝 지난번에 낸 문제 풀기" empty="풀 문제가 없어요. 오늘 문제를 내면 내일 풀 수 있어요!" onDone={reload} />}
        </div>
        <div className="flex flex-col gap-5">
          {quizzes && <MakeQuiz made={quizzes.made} onDone={reload} />}
          {quizzes && quizzes.wrong.length > 0 && <Solve list={quizzes.wrong} title="📒 오답노트 (다시 풀어 봐요)" empty="" onDone={reload} showAnswer />}
        </div>
      </div>
    </main>
  );
}

function Reflection() {
  const [learned, setLearned] = useState("");
  const [mood, setMood] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ learned: string; mood: string } | null>("/api/reflections").then((r) => {
      if (r && "learned" in r) {
        setLearned(r.learned);
        setMood(r.mood);
        setSaved(true);
      }
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); // 두 번 눌러도 한 번만 저장
    const res = await api("/api/reflections", { learned, mood });
    setBusy(false);
    setError(res.error ?? "");
    if (!res.error) setSaved(true);
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">✍️ 오늘의 한 줄 평</h2>
      <input value={learned} onChange={(e) => { setLearned(e.target.value); setSaved(false); }} maxLength={200}
        placeholder="오늘 배운 것 한 줄 (예: 광합성은 빛으로 양분을 만드는 것)" className="input" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500">오늘 기분</span>
        {MOODS.map((m) => (
          <button key={m} type="button" onClick={() => { setMood(m); setSaved(false); }} aria-pressed={mood === m}
            className={`size-11 rounded-full text-2xl ${mood === m ? "bg-indigo-100 ring-2 ring-indigo-500 dark:bg-indigo-950" : "opacity-50"}`}>
            {m}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button disabled={!learned.trim() || !mood || saved || busy} className="btn">{saved ? "저장했어요 ✓" : "저장하기"}</button>
    </form>
  );
}

function MakeQuiz({ made, onDone }: { made: QuizView[]; onDone: () => void }) {
  const [type, setType] = useState<QuizView["type"]>("short");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const full = made.length >= QUIZ_PER_DAY;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const res = await api("/api/quizzes", {
      type, subject: f.get("subject"), question: f.get("question"), answer,
      ...(type === "choice" && { choices: choices.map((c) => c.trim()).filter(Boolean) }),
    });
    setError(res.error ?? "");
    if (res.error) return;
    form.reset();
    setAnswer("");
    setChoices(["", "", "", ""]);
    onDone();
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">❓ 오늘 공부한 걸로 문제 내기 <span className="text-sm font-normal text-zinc-500">{made.length}/{QUIZ_PER_DAY}</span></h2>
      {made.map((q) => (
        <div key={q.quiz_id} className="rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900">
          {q.question} <span className="text-zinc-500">→ {q.answer}</span>
        </div>
      ))}
      {full ? (
        <p className="text-sm text-zinc-500">오늘 문제를 다 냈어요. 내일 풀어 봐요! 🙌</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-1">
            {([["short", "단답"], ["ox", "O / X"], ["choice", "객관식"]] as const).map(([t, label]) => (
              <button key={t} type="button" onClick={() => { setType(t); setAnswer(""); }} aria-pressed={type === t}
                className={`min-h-11 rounded-lg border-2 text-sm ${type === t ? "border-indigo-600 bg-indigo-50 font-semibold dark:bg-indigo-950" : "border-zinc-200 dark:border-zinc-700"}`}>
                {label}
              </button>
            ))}
          </div>
          <input name="subject" placeholder="과목 (예: 과학)" list="quiz-subjects" maxLength={20} className="input" />
          <datalist id="quiz-subjects">{["국어", "영어", "수학", "과학", "사회", "역사"].map((s) => <option key={s} value={s} />)}</datalist>
          <textarea name="question" required maxLength={300} rows={2} placeholder="문제 (예: 식물이 빛으로 양분을 만드는 과정은?)" className="input py-2" />
          <p className="-mt-1 text-xs text-zinc-500">📷 문제를 사진으로 넣고 싶으면 폰의 <b>텍스트 스캔·텍스트 추출</b>을 써요 (<Link href="/help" className="underline">방법 보기</Link>)</p>

          {type === "short" && <input value={answer} onChange={(e) => setAnswer(e.target.value)} required maxLength={100} placeholder="정답 (예: 광합성)" className="input" />}
          {type === "ox" && (
            <div className="grid grid-cols-2 gap-2">
              {["O", "X"].map((o) => (
                <button key={o} type="button" onClick={() => setAnswer(o)} aria-pressed={answer === o}
                  className={`min-h-11 rounded-lg border-2 text-xl font-bold ${answer === o ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : "border-zinc-200 dark:border-zinc-700"}`}>
                  {o}
                </button>
              ))}
            </div>
          )}
          {type === "choice" && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">보기를 쓰고, 정답 보기의 동그라미를 눌러요</span>
              {choices.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button type="button" onClick={() => c.trim() && setAnswer(c.trim())} aria-label={`${i + 1}번을 정답으로`}
                    className={`size-11 shrink-0 rounded-full border-2 font-bold ${answer && answer === c.trim() ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300"}`}>
                    {i + 1}
                  </button>
                  <input value={c} maxLength={100} placeholder={`보기 ${i + 1}${i >= 2 ? " (안 써도 돼요)" : ""}`} className="input"
                    onChange={(e) => { const next = [...choices]; next[i] = e.target.value; setChoices(next); if (answer === c.trim()) setAnswer(""); }} />
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button disabled={!answer} className="btn">문제 내기</button>
        </form>
      )}
    </section>
  );
}

function Solve({ list, title, empty, onDone, showAnswer }: { list: QuizView[]; title: string; empty: string; onDone: () => void; showAnswer?: boolean }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">{title}</h2>
      {!list.length && <p className="text-sm text-zinc-500">{empty}</p>}
      {list.map((q) => <SolveOne key={q.quiz_id} q={q} onDone={onDone} showAnswer={showAnswer} />)}
    </section>
  );
}

function SolveOne({ q, onDone, showAnswer }: { q: QuizView; onDone: () => void; showAnswer?: boolean }) {
  const [given, setGiven] = useState("");
  const [result, setResult] = useState<{ correct: boolean; answer: string }>();
  const [reveal, setReveal] = useState(false);

  async function check(answer: string) {
    const res = await api<{ correct: boolean; answer: string }>(`/api/quizzes/${q.quiz_id}/answer`, { answer });
    if (!res.error) setResult(res);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
      <div className="text-sm">
        {q.subject && <span className="mr-1 rounded bg-indigo-100 px-1.5 py-0.5 text-[11px] text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{q.subject}</span>}
        {q.question}
      </div>
      {result ? (
        <div className="flex items-center justify-between gap-2">
          <span className={result.correct ? "font-bold text-emerald-600" : "text-rose-600"}>
            {result.correct ? "⭕ 정답이에요!" : `❌ 아쉬워요. 정답: ${result.answer}`}
          </span>
          <button onClick={onDone} className="inline-flex min-h-11 items-center text-sm text-zinc-500 underline">확인</button>
        </div>
      ) : q.type === "short" ? (
        <form onSubmit={(e) => { e.preventDefault(); check(given); }} className="flex gap-2">
          <input value={given} onChange={(e) => setGiven(e.target.value)} placeholder="답" maxLength={100} className="input" />
          <button disabled={!given.trim()} className="btn shrink-0">확인</button>
        </form>
      ) : (
        <div className={`grid gap-2 ${q.type === "ox" ? "grid-cols-2" : "grid-cols-1"}`}>
          {(q.type === "ox" ? ["O", "X"] : q.choices).map((c, i) => (
            <button key={c} onClick={() => check(c)} className={`min-h-11 rounded-lg border-2 border-zinc-200 px-3 dark:border-zinc-700 ${q.type === "ox" ? "text-xl font-bold" : "text-left text-sm"}`}>
              {q.type === "choice" && `${i + 1}. `}{c}
            </button>
          ))}
        </div>
      )}
      {showAnswer && !result && (
        <button onClick={() => setReveal(!reveal)} className="self-start text-xs text-zinc-500 underline">
          {reveal ? `정답: ${q.answer}` : "정답 보기"}
        </button>
      )}
    </div>
  );
}
