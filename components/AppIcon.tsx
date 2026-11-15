// 앱 아이콘 그림 (next/og ImageResponse용): 보라 배경 위 도트 고양이
import { characterById, pixels } from "@/lib/characters";

export function AppIcon({ size }: { size: number }) {
  const cat = characterById("cat")!;
  const n = cat.art?.length ?? 16;
  const cell = Math.floor((size * 0.7) / n);
  const offset = Math.floor((size - cell * n) / 2);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#4f46e5" }}>
      {pixels(cat).map(([x, y, fill]) => (
        <div key={`${x}-${y}`} style={{ position: "absolute", left: offset + x * cell, top: offset + y * cell, width: cell, height: cell, background: fill }} />
      ))}
    </div>
  );
}
