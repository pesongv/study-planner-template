import Link from "next/link";

// 학생용 사용 설명서 (정적 페이지)
const SECTIONS: { emoji: string; title: string; steps: React.ReactNode[] }[] = [
  {
    emoji: "📅", title: "시험 공부 계획 세우기 (순서대로!)",
    steps: [
      <><b>D-day 등록</b> — <Link href="/plan" className="text-indigo-600 underline">계획</Link> › 오늘 탭 맨 위 빨간 카드 › <b>+ D-day 등록</b> › 시험 이름과 <b>첫날</b></>,
      <><b>월 목표 만들기</b> — 계획 › <b>월간</b> 탭 › 월 목표 추가 › 제목·과목 + <b>시험 범위</b> (교과서 13~20쪽, 유인물 1~5장처럼 여러 줄). 주간 목표는 자동으로 생겨요</>,
      <><b>📖 D-day까지 나누기</b> — 월 목표 아래 버튼 › 이 과목 <b>시험 날</b> 확인 › 쉬는 요일·복습일 고르기 › <b>이대로 나누기</b></>,
      <><b>매일 체크</b> — 오늘 탭 맨 위 <b>📖 오늘 볼 분량</b>을 공부하고 <b>✓</b>를 누르면 초록 불! 주간·월간 막대도 같이 올라가요</>,
      <>못 끝낸 날은 <b>내일로</b>, 진도가 밀리면 <b>D-day까지 다시 나누기</b> (끝낸 날은 그대로 둬요)</>,
    ],
  },
  {
    emoji: "🪑", title: "독서실",
    steps: [
      <>첫 화면에서 <b>○번 자리에 앉기</b> → 캐릭터가 걸어가 앉고 스탠드가 켜져요 (= 출석)</>,
      <>공부가 끝나면 <b>퇴실하기</b>. 깜빡해도 3시간 뒤나 자정에 자동 퇴실돼요</>,
      <>친구들이 앉은 모습은 20초마다 새로 보여요</>,
    ],
  },
  {
    emoji: "⏱️", title: "타이머와 별 ⭐",
    steps: [
      <>독서실 오른쪽 타이머에서 <b>포모도로 25/5 · 50/10 · 자유</b> 중 고르고 <b>시작!</b></>,
      <>타이머 <b>25분마다 ⭐1개</b>, <b>오늘 인증</b>을 마치면 <b>⭐1개 더</b></>,
      <>창을 닫았다 와도 시간은 이어져요. 쉬는 시간엔 물 한 잔 💧</>,
    ],
  },
  {
    emoji: "🏅", title: "오늘 인증",
    steps: [
      <>아래 4가지 중 <b>2가지</b>를 하면 인증 완료!</>,
      <>✓ 할 일 1개 이상 완료 · ⏱️ 타이머 25분 · ✍️ 한 줄 평 · ❓ 퀴즈 내기/풀기</>,
      <>며칠 연속으로 인증하면 🔥 불꽃이 커지고 뱃지를 받아요</>,
    ],
  },
  {
    emoji: "✍️", title: "한 줄 평 · 퀴즈",
    steps: [
      <><Link href="/journal" className="text-indigo-600 underline">한 줄 평·퀴즈</Link>에서 오늘 배운 것 한 줄 + 기분</>,
      <>오늘 공부한 걸로 <b>문제를 직접 내면</b> (하루 3개까지) <b>내일</b> 풀 수 있어요. 틀린 문제는 오답노트로!</>,
    ],
  },
  {
    emoji: "📷", title: "문제를 사진으로 입력하기 (폰 기능, 무료)",
    steps: [
      <><b>아이폰</b>: 문제 칸을 길게 누르기 › <b>텍스트 스캔</b> › 문제에 카메라 대기 › <b>입력</b></>,
      <><b>갤럭시</b>: 문제 칸을 누르고 키보드 위 <b>⋯</b> › <b>텍스트 추출</b> (또는 사진 앱의 <b>T</b> 버튼으로 글자 복사)</>,
      <><b>구글 렌즈</b>: 사진에서 글자 선택 › <b>복사</b> › 문제 칸에 붙여 넣기</>,
      <>수식(x², √, 분수)은 조금 틀리게 읽힐 수 있어요. 붙여 넣은 뒤 <b>한 번 확인하고 고쳐요</b></>,
    ],
  },
  {
    emoji: "📊", title: "리포트",
    steps: [<><Link href="/report" className="text-indigo-600 underline">리포트</Link>에서 이번 주 요일별·과목별 공부 시간을 보고 한 주를 돌아봐요</>],
  },
  {
    emoji: "🔑", title: "비밀번호를 잊었어요",
    steps: [<>선생님께 말하면 초기화해 줘요. 다시 <b>000000</b>으로 들어가서 새 비밀번호로 바꿔요</>],
  },
];

export default function HelpPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4 md:max-w-3xl">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold">❓ 사용 설명서</h1>
        <Link href="/" className="inline-flex min-h-11 items-center text-sm text-zinc-500 underline">독서실로</Link>
      </header>
      {SECTIONS.map((s) => (
        <section key={s.title} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 font-semibold">{s.emoji} {s.title}</h2>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed">
            {s.steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </section>
      ))}
    </main>
  );
}
