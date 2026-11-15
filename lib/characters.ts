// 캐릭터 레지스트리. art = 직접 그린 오리지널 16x16 도트, src = 외부 CC0 에셋 그림(32x32).
// 에셋 추가 시 public/characters/LICENSES.md 에 출처 기록.

// 공통 색: k 외곽선, w 흰색, e 눈, p 볼터치, y 노랑, v 바이저, g 빨강
// 캐릭터별: a 몸, h 밝은 쪽, d 그림자, n 코·귀 안쪽, m 보조, b 옷, c 옷 그림자
const BASE: Record<string, string> = { k: "#2b2b2b", w: "#ffffff", e: "#1f1f1f", p: "#f7a1b5", y: "#ffd166", v: "#3a6ea5", g: "#e63946" };

// 둥근 머리 + 어깨 (3~15행). 귀·얼굴은 캐릭터마다 덮어씀
const HEAD = [
  "...kaaaaaaaak...",
  "..kahhaaaaaaak..",
  "..kahaaaaaaaak..",
  "..kaaweaaweaak..",
  "..kaaeeaaeeaak..",
  "..kppaannaappk..",
  "..kdaaakkaaadk..",
  "...kddaaaaddk...",
  "....kkkkkkkk....",
];
const BODY = [
  "...kbbbbbbbbk...",
  "..kbbbbbbbbbbk..",
  "..kbcbbbbbbcbk..",
  "..kbcbbbbbbcbk..",
];

export type CharacterDef =
  | { id: string; name: string; colors: Record<string, string>; art: string[]; src?: undefined }
  | { id: string; name: string; src: string; grid: number; art?: undefined };

// MetroCity (JIK-A-4, CC0) 몸·옷·머리를 합성한 학생 캐릭터
const metro = (id: string, name: string): CharacterDef => ({ id, name, src: `/characters/${id}.png`, grid: 32 });

export const CHARACTERS: CharacterDef[] = [
  {
    id: "cat", name: "고양이",
    colors: { a: "#f4a261", h: "#f8c291", d: "#d9823b", n: "#f7a1b5", b: "#4a90c2", c: "#3a78a8" },
    art: [
      "...kk......kk...",
      "...knk....knk...",
      "...knkkkkkknk...",
      ...HEAD,
      ...BODY,
    ],
  },
  {
    id: "dog", name: "강아지",
    colors: { a: "#e9c46a", h: "#f4dc9b", d: "#c9a24a", m: "#8d5524", n: "#ef7b8b", b: "#2a9d8f", c: "#21857a" },
    art: [
      "................",
      "................",
      "....kkkkkkkk....",
      ".kkkaaaaaaaakkk.",
      "kmkahhaaaaaaakmk",
      "kmkahaaaaaaaakmk",
      "kmkaaweaaweaakmk",
      "kmkaaeeaaeeaakmk",
      ".kkppaakkaappkk.",
      "..kdaaakkaaadk..",
      "...kddannaddk...",
      "....kkkkkkkk....",
      ...BODY,
    ],
  },
  {
    id: "rabbit", name: "토끼",
    colors: { a: "#f5f5f5", h: "#ffffff", d: "#d9d9e0", n: "#f7a1b5", b: "#e76f51", c: "#c8553b" },
    art: [
      "....kk....kk....",
      "...knnk..knnk...",
      "...knnkkkknnk...",
      ...HEAD,
      ...BODY,
    ],
  },
  {
    id: "bear", name: "곰",
    colors: { a: "#9c6644", h: "#b98260", d: "#7a4e33", m: "#e3c9a8", n: "#d9a07a", b: "#6a994e", c: "#557d3e" },
    art: [
      "................",
      "..kkk......kkk..",
      "..knkkkkkkkknk..",
      "..kkaaaaaaaakk..",
      "..kahhaaaaaaak..",
      "..kahaaaaaaaak..",
      "..kaaweaaweaak..",
      "..kaaeeaaeeaak..",
      "..kppamkkmappk..",
      "..kdaammmmaadk..",
      "...kddaaaaddk...",
      "....kkkkkkkk....",
      ...BODY,
    ],
  },
  {
    id: "penguin", name: "펭귄",
    colors: { a: "#2f3e57", h: "#4a5d7e", d: "#1f2a3d", b: "#f4a261", c: "#d9823b" },
    art: [
      "................",
      "................",
      "....kkkkkkkk....",
      "...kaaaaaaaak...",
      "..kahhaaaaaaak..",
      "..kaawwwwwwaak..",
      "..kawewwwwewak..",
      "..kawewyywewak..",
      "..kapwwyywwpak..",
      "..kdawwwwwwadk..",
      "...kddwwwwddk...",
      "....kkkkkkkk....",
      ...BODY,
    ],
  },
  {
    id: "fox", name: "여우",
    colors: { a: "#e76f51", h: "#f4a07f", d: "#c4502f", n: "#2b2b2b", b: "#3d405b", c: "#2c2e44" },
    art: [
      "..kk........kk..",
      "..knk......knk..",
      "..knnkkkkkknnk..",
      "...kaaaaaaaak...",
      "..kahhaaaaaaak..",
      "..kahaaaaaaaak..",
      "..kaaweaaweaak..",
      "..kaaeeaaeeaak..",
      "..kwwaakkaawwk..",
      "..kwwwaaaawwwk..",
      "...kwwwwwwwwk...",
      "....kkkkkkkk....",
      ...BODY,
    ],
  },
  {
    id: "astronaut", name: "우주인",
    colors: { h: "#ffffff", w: "#eceef4", b: "#e3e5ee", c: "#c3c6d4" },
    art: [
      "................",
      "................",
      "....kkkkkkkk....",
      "...kwwwwwwwwk...",
      "..kwhwwwwwwwwk..",
      "..kwkkkkkkkkwk..",
      "..kwkvvvvhvkwk..",
      "..kwkvvvvvvkwk..",
      "..kwkvvvvvvkwk..",
      "..kwkkkkkkkkwk..",
      "...kwwwwwwwwk...",
      "....kkkkkkkk....",
      "...kbbbbbbbbk...",
      "..kbbgbbbbybbk..",
      "..kbcbbbbbbcbk..",
      "..kbcbbbbbbcbk..",
    ],
  },
  {
    id: "robot", name: "로봇",
    colors: { a: "#adb5bd", h: "#dee2e6", b: "#6c757d", c: "#565e64" },
    art: [
      ".......yy.......",
      ".......kk.......",
      "...kkkkkkkkkk...",
      "...kahhaaaaak...",
      "...kaaaaaaaak...",
      "...kakkaakkak...",
      "...kakyaakyak...",
      "...kakkaakkak...",
      "...kaaaaaaaak...",
      "...kawkwkwkak...",
      "...kaaaaaaaak...",
      "...kkkkkkkkkk...",
      ...BODY,
    ],
  },
  metro("uniform-short", "교복 숏컷"),
  metro("uniform-long", "교복 긴머리"),
  metro("spiky", "뾰족머리"),
  metro("bun", "똥머리"),
  metro("overalls", "멜빵"),
  metro("braids", "땋은 머리"),
  metro("curly", "곱슬머리"),
  metro("blond", "노랑머리"),
];

export const characterById = (id: string) => CHARACTERS.find((c) => c.id === id);

/** 도트 → [x, y, 색] 목록 */
export function pixels(c: CharacterDef): [number, number, string][] {
  if (!c.art) return [];
  const colors = { ...BASE, ...c.colors };
  return c.art.flatMap((row, y) =>
    [...row].flatMap((ch, x) => (ch === "." ? [] : [[x, y, colors[ch]] as [number, number, string]])),
  );
}

/** 같은 색이 가로로 이어진 칸은 한 막대로 → [x, y, 길이, 색] (확대해도 틈이 안 생김) */
export function runs(c: CharacterDef): [number, number, number, string][] {
  const out: [number, number, number, string][] = [];
  for (const [x, y, fill] of pixels(c)) {
    const last = out.at(-1);
    if (last && last[1] === y && last[0] + last[2] === x && last[3] === fill) last[2]++;
    else out.push([x, y, 1, fill]);
  }
  return out;
}
