export const THEME_COOKIE_KEY = "revi-blog-theme"

// globals.css --color-background(light/dark)와 동일한 값 — iOS Safari 상단/하단 툴바를
// 실제 페이지 배경색과 맞추는 <meta name="theme-color">에 쓰인다. CSS 변수를 meta 태그에서
// 직접 참조할 수 없어 값 자체를 여기 복제해 둔다.
export const THEME_COLORS = {
  dark: "#0b1326",
  light: "#f7f9fb",
} as const
