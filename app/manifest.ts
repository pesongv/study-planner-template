import type { MetadataRoute } from "next";

// 폰에서 "홈 화면에 추가"하면 앱처럼 열리게
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "우리 반 독서실",
    short_name: "독서실",
    description: "함께 공부하는 우리 반 스터디 플래너",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
