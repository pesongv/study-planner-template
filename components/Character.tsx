import { characterById, runs } from "@/lib/characters";

/** 도트 캐릭터. 한 칸 크기를 정수 px로 맞춰서(격자 × n) 폰에서도 흐리거나 들쭉날쭉하지 않게 */
export function Character({ id, size = 32, className = "" }: { id: string; size?: number; className?: string }) {
  const c = characterById(id);
  if (!c) return null;
  const n = c.art ? c.art.length : c.grid;
  const px = Math.max(1, Math.round(size / n)) * n;
  if (!c.art) {
    // eslint-disable-next-line @next/next/no-img-element -- 32px 도트 그림은 최적화가 필요 없고, 픽셀이 뭉개지지 않게 그대로 확대
    return <img src={c.src} alt={c.name} width={px} height={px} className={`pixel-char max-w-none [image-rendering:pixelated] ${className}`} />;
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={px} height={px} shapeRendering="crispEdges" className={`pixel-char max-w-none ${className}`} role="img" aria-label={c.name}>
      {runs(c).map(([x, y, w, fill]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} fill={fill} />
      ))}
    </svg>
  );
}
