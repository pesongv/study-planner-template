import { Character } from "./Character";
import { characterById } from "@/lib/characters";

/** 독서실 칸막이 책상 (앞에서 본 모습). 앉아 있으면 캐릭터가 책상 뒤에 보이고 스탠드 불이 켜짐 */
export function Desk({ no, name, character, seated, me }: { no: number; name?: string; character?: string; seated: boolean; me: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative h-[72px] w-full overflow-hidden rounded-t-md border-x-[3px] border-t-[3px] border-[#8b6b4a] bg-[#f6ead3] dark:border-[#a07c56] dark:bg-[#3d342b] ${
          me ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-amber-50 dark:ring-offset-stone-900" : ""
        }`}
      >
        {/* 칸막이 안쪽 그림자 */}
        <div className="absolute inset-y-0 left-0 w-1 bg-black/5 dark:bg-black/20" />
        <div className="absolute inset-y-0 right-0 w-1 bg-black/5 dark:bg-black/20" />

        {/* 스탠드: 앉아 있으면 불빛 */}
        {seated && <div className="absolute -right-2 top-1 h-14 w-10 bg-[radial-gradient(ellipse_at_top,rgba(255,214,102,0.7),transparent_70%)]" />}
        <div className="absolute right-1 top-1.5 flex flex-col items-end">
          <div className={`h-1.5 w-3.5 rounded-t-full ${seated ? "bg-amber-400" : "bg-zinc-500"}`} />
          <div className="mr-2.5 h-5 w-0.5 bg-zinc-500" />
        </div>

        {/* 앉은 캐릭터 (책상 판 뒤로 아래쪽이 가려짐) */}
        {seated && character && (
          // 학생 그림(32칸, 여백 많음)은 2배, 동물(16칸)은 3배 — 둘 다 머리~가슴이 책상 위로 보이게
          <div className={`absolute left-1/2 -translate-x-1/2 ${characterById(character)?.art ? "top-1.5" : "top-0.5"}`}>
            <Character id={character} size={characterById(character)?.art ? 48 : 64} />
          </div>
        )}

        {/* 책상 판 + 자리 번호 명패 */}
        <div className="absolute inset-x-0 bottom-0 flex h-[18px] items-center justify-center border-t-2 border-[#8b6b4a] bg-[#c4935f] dark:border-[#a07c56] dark:bg-[#7a5a3a]">
          <span className="rounded-sm bg-[#fdf6e3] px-1 text-[9px] font-bold leading-3 text-[#6b4f33]">{no}</span>
        </div>
      </div>
      <span className={`mt-0.5 h-4 max-w-full truncate text-[10px] ${me ? "font-bold text-indigo-600" : "text-zinc-500"}`}>{name ?? ""}</span>
    </div>
  );
}
