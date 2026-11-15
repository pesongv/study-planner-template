import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 서버 전용: 127.0.0.1과 같은 와이파이의 폰(IP 주소)으로도 테스트 가능하게. 배포(Vercel)에는 영향 없음
  allowedDevOrigins: ["127.0.0.1", "*.*.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
