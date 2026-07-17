import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// core/*.html에서 가져온 Material Design 3 색상 토큰 이름 (app/globals.css의 @theme와 동일).
// tailwind-merge는 커스텀 @theme 확장을 모르기 때문에, 이 이름들을 알려주지 않으면
// text-code-sm(폰트 크기)과 text-primary-fixed(색상)처럼 같은 `text-` 접두사를 쓰는
// 서로 다른 유틸리티를 같은 충돌 그룹으로 오인해 하나를 조용히 지워버린다.
const colorTokens = [
  "background",
  "error",
  "error-container",
  "inverse-on-surface",
  "inverse-primary",
  "inverse-surface",
  "on-background",
  "on-error",
  "on-error-container",
  "on-primary",
  "on-primary-container",
  "on-primary-fixed",
  "on-primary-fixed-variant",
  "on-secondary",
  "on-secondary-container",
  "on-secondary-fixed",
  "on-secondary-fixed-variant",
  "on-surface",
  "on-surface-variant",
  "on-tertiary",
  "on-tertiary-container",
  "on-tertiary-fixed",
  "on-tertiary-fixed-variant",
  "outline",
  "outline-variant",
  "primary",
  "primary-container",
  "primary-fixed",
  "primary-fixed-dim",
  "secondary",
  "secondary-container",
  "secondary-fixed",
  "secondary-fixed-dim",
  "surface",
  "surface-bright",
  "surface-container",
  "surface-container-high",
  "surface-container-highest",
  "surface-container-low",
  "surface-container-lowest",
  "surface-dim",
  "surface-tint",
  "surface-variant",
  "tertiary",
  "tertiary-container",
  "tertiary-fixed",
  "tertiary-fixed-dim",
]

const fontSizeTokens = [
  "body-md",
  "label-caps",
  "headline-lg-mobile",
  "headline-lg",
  "code-sm",
  "headline-xl",
]

const spacingTokens = ["base", "stack-sm", "stack-md", "stack-lg", "gutter", "section-gap"]

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      colors: colorTokens,
      spacing: spacingTokens,
    },
    classGroups: {
      "font-size": [{ text: fontSizeTokens }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
