import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 기본 썸네일(public/images/default-thumbnail.svg)은 우리가 직접 작성한 신뢰된
    // 정적 자산이라 SVG 최적화를 허용한다. 업로드된 콘텐츠가 아니므로 CSP 샌드박스로
    // 스크립트 실행만 차단하면 안전하다 (Next.js 공식 권장 설정).
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // core/home-dark.html / core/article-detail-dark.html이 원래 쓰던 썸네일 호스트.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/aida-public/**",
      },
    ],
  },
};

export default nextConfig;
