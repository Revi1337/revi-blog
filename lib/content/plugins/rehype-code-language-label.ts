import { visit } from "unist-util-visit"
import type { Root, Element } from "hast"

/** rehype-pretty-code가 pre에 붙이는 data-language는 소문자 raw 태그(예: "js", "plantuml")라
 * 그대로 보여주면 읽기 불편하다 — 사람이 읽는 이름으로 매핑한다. mermaid/plantuml/markmap은 이
 * 블로그가 다이어그램으로 렌더링하는 세 타입이라 우선 포함하고, 나머지는 content/articles/**
 * 전수 조사(2026-08 기준: python 68, mermaid 8, plantuml 7, text 6, md 5, bash 5, markmap 4,
 * js 2, typescript 1)로 실제 쓰이는 태그를 확인한 뒤, 앞으로 쓰일 법한 일반 언어까지 선제적으로
 * 채워뒀다. text-transform: capitalize로는 못 잡는 불규칙 표기(JavaScript, PlantUML, C++, C#,
 * SQL 등 첫 글자 대문자 규칙을 안 따르는 이름들) 때문에 CSS가 아니라 여기서 처리한다. */
const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  mermaid: "Mermaid",
  plantuml: "PlantUML",
  markmap: "Markmap",

  python: "Python",
  py: "Python",
  js: "JavaScript",
  javascript: "JavaScript",
  jsx: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  tsx: "TypeScript",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  zsh: "Zsh",
  md: "Markdown",
  markdown: "Markdown",
  text: "Text",
  txt: "Text",
  plaintext: "Text",

  go: "Go",
  golang: "Go",
  rust: "Rust",
  rs: "Rust",
  java: "Java",
  c: "C",
  cpp: "C++",
  "c++": "C++",
  csharp: "C#",
  cs: "C#",
  php: "PHP",
  ruby: "Ruby",
  rb: "Ruby",
  swift: "Swift",
  kotlin: "Kotlin",
  kt: "Kotlin",
  scala: "Scala",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  less: "Less",
  json: "JSON",
  jsonc: "JSON",
  yaml: "YAML",
  yml: "YAML",
  toml: "TOML",
  xml: "XML",
  sql: "SQL",
  graphql: "GraphQL",
  dockerfile: "Dockerfile",
  docker: "Dockerfile",
  makefile: "Makefile",
  ini: "INI",
  diff: "Diff",
  powershell: "PowerShell",
  ps1: "PowerShell",
  vim: "Vim",
  lua: "Lua",
  perl: "Perl",
  r: "R",
  dart: "Dart",
  elixir: "Elixir",
  haskell: "Haskell",
  clojure: "Clojure",
  nginx: "Nginx",
  apache: "Apache",
}

/** 매핑에 없는 언어는 첫 글자만 대문자로 바꿔 최소한의 가독성을 확보한다 — 완벽하진 않지만(JS/SQL
 * 류 약어는 못 잡음) raw 소문자 태그를 그대로 노출하거나 라벨을 아예 생략하는 것보다는 낫다. */
function displayLanguage(language: string): string {
  return LANGUAGE_DISPLAY_NAMES[language.toLowerCase()] ?? language.charAt(0).toUpperCase() + language.slice(1)
}

function languageLabelNode(language: string): Element {
  return {
    type: "element",
    tagName: "span",
    properties: { "data-code-language-label": "" },
    children: [{ type: "text", value: displayLanguage(language) }],
  }
}

/** rehype-pretty-code가 생성한 `<figure data-rehype-pretty-code-figure>`마다, 자식 `pre`에
 * 이미 붙어있는 `data-language`(모든 언어에 대해 rehype-pretty-code가 자동으로 붙임 — mermaid/
 * plantuml/markmap도 예외 아님)를 그대로 읽어 macOS 타이틀바에 표시할 라벨을 별도 엘리먼트로
 * 삽입한다. `pre` 자신에 CSS로 라벨을 붙이지 않는 이유: Mermaid/PlantUML/Markmap 세 핸들러 모두
 * 렌더링 성공 시 `pre.style.display = "none"`으로 원본을 숨기는데, `display:none`은 그 요소의
 * 의사 요소(::before/::after)도 함께 렌더링에서 제외시킨다 — 라벨이 가장 보여야 할 순간(다이어그램이
 * 떠 있는 동안)에 사라져버린다. figure의 형제 요소로 독립시켜야 pre 가시성과 무관하게 유지된다. */
export function rehypeCodeLanguageLabel() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "figure" || !("data-rehype-pretty-code-figure" in node.properties)) return

      const pre = node.children.find(
        (child): child is Element => child.type === "element" && child.tagName === "pre"
      )
      const language = pre?.properties?.["data-language"]
      if (typeof language !== "string" || language.length === 0) return

      node.children.push(languageLabelNode(language))
    })
  }
}
