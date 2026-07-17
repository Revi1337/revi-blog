"use client"

import { LazyMotion, domAnimation } from "motion/react"

// domAnimation feature bundle만 로드 — drag/layout 애니메이션(domMax)은 이 프로젝트에서
// 쓰지 않으므로 제외해 번들을 줄인다 (research.md #1, vercel-react-best-practices bundle 규칙).
//
// strict 모드는 껐다 — article-header.tsx가 Motion이 공식 제공하는 RSC 전용 경량 패턴
// (`motion/react-client`의 사전 바인딩된 컴포넌트)을 의도적으로 쓰는데, strict 모드는
// 이걸 "실수로 들어간 무거운 motion/react import"와 구분하지 못하고 런타임 에러를 던진다
// (motion.dev/troubleshooting/lazy-strict-mode). strict가 잡으려는 건 그 실수 케이스이지
// 이 의도된 RSC 패턴이 아니므로, 여기서는 꺼두는 게 맞다.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
