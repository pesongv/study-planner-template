import type { Metadata, Viewport } from "next";
import "./globals.css";

const description = "함께 공부하는 우리 반 스터디 플래너 📚";

export const metadata: Metadata = {
  // 카톡 등 링크 미리보기용 이미지 주소의 기준 (Vercel이 넣어 주는 실제 주소)
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  title: "우리 반 독서실",
  description,
  openGraph: { title: "우리 반 독서실", description, siteName: "우리 반 독서실", locale: "ko_KR", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
