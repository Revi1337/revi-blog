export const THEME_STORAGE_KEY = "revi-blog-theme"

// 하이드레이션 전에 동기적으로 실행되어 dark/light 클래스를 적용한다 (FOUC 방지).
// 클릭형 토글 UI는 002(theme-toggle) 범위 — 이 스크립트는 그 토글이 나중에
// localStorage에 쓸 수 있도록 동일한 key(THEME_STORAGE_KEY)만 미리 약속해둔다.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
}
