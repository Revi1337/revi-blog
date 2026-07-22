import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 기본 썸네일(public/images/default-thumbnail.svg)은 우리가 직접 작성한 신뢰된
    // 정적 자산이라 SVG 최적화를 허용한다. 업로드된 콘텐츠가 아니므로 CSP 샌드박스로
    // 스크립트 실행만 차단하면 안전하다 (Next.js 공식 권장 설정).
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // 썸네일 URL은 본인이 커밋하는 마크다운에서만 나오므로(런타임에 외부 사용자가 주입할
    // 경로가 없음) 호스트별 화이트리스트 대신 https 전체를 허용한다.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
