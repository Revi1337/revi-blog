"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AlertCircle, Check, ChevronDown, Copy } from "lucide-react"
import { m, AnimatePresence } from "motion/react"

/** OpenAI(ChatGPT) 로고 — resilience4j(readme.io)의 "Open in ChatGPT" 드롭다운 항목에서 실측한
 * 공식 마크 그대로(viewBox 0 0 24 24). 외부 서비스로 연결하는 링크의 식별 용도이므로(그 서비스를
 * 사칭하는 게 아니라 "이 버튼을 누르면 어디로 가는지" 알려주는 표준적인 용법), 자체 추측 아이콘
 * 대신 실제 브랜드 마크를 그대로 가져왔다. */
function OpenAIIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M22.282 9.821a5.984 5.984 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.984 5.984 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.05 6.05 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.989 5.989 0 0 0 3.997-2.9 6.055 6.055 0 0 0-.747-7.073ZM13.26 22.43a4.476 4.476 0 0 1-2.877-1.04l.142-.081 4.779-2.758a.796.796 0 0 0 .392-.681v-6.737l2.02 1.168a.07.07 0 0 1 .038.052v5.583a4.503 4.503 0 0 1-4.494 4.494ZM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.772.772 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646ZM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.677l5.815 3.354-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872v.024Zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667Zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66v.02Zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.056V6.074a4.5 4.5 0 0 1 7.375-3.454l-.142.081-4.778 2.758a.795.795 0 0 0-.393.681l-.004 6.723Zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5-.005-3Z"
      />
    </svg>
  )
}

/** Claude(Anthropic) 로고 — 위와 동일한 출처(resilience4j readme.io)에서 실측한 공식 마크. */
function ClaudeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="m4.709 15.956 4.72-2.648.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.104 2.278.157 1.652.098 2.449.255h.389l.055-.158-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 0 1-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.236-2.095.231-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.189-.02 2.855-.606 1.544-.28 1.84-.315.833.388.091.395-.328.807-1.969.486-2.309.461-3.439.814-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.828-.91-1.313-.329h-.182v.11l1.094 1.068 2.005 1.81 2.509 2.33.128.578-.322.455-.34-.049-2.206-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.212-.668-.12-1.373-1.925-1.416-2.168-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.007Z"
      />
    </svg>
  )
}

/** Markdown 로고(markdown-mark 프로젝트, CC0) — 역시 resilience4j에서 실측한 동일 마크(viewBox
 * 0 0 640 512, 가로가 더 긴 비율이라 h-3.5 w-5로 다른 아이콘과 세로 높이만 맞춘다). */
function MarkdownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 640 512" fill="none" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M593.8 59.1H46.2C20.7 59.1 0 79.8 0 105.2v301.5c0 25.5 20.7 46.2 46.2 46.2h547.7c25.5 0 46.2-20.7 46.1-46.1V105.2c0-25.4-20.7-46.1-46.2-46.1ZM338.5 360.6H277v-120l-61.5 76.9-61.5-76.9v120H92.3V151.4h61.5l61.5 76.9 61.5-76.9h61.5v209.2h.2Zm135.3 3.1L381.5 256H443V151.4h61.5V256H566l-92.2 107.7Z"
      />
    </svg>
  )
}

type CopyStatus = "idle" | "copied" | "error"

const COPY_STATUS_RESET_MS = 1600

/** TOC 카드(toc-sidebar.tsx) 바로 위, 데스크탑 전용으로 노출되는 컴팩트 split-button —
 * resilience4j(readme.io)/Vercel 문서의 "Copy Page" 패턴을 그대로 따른다: 왼쪽은 클릭하면 바로
 * 복사되는 주 버튼("Copy Page" 자체가 기본 동작), 오른쪽은 별도의 작은 쉐브론 버튼으로 나머지
 * 세 동작(Open in ChatGPT/Claude, View as Markdown)을 드롭다운에 담는다 — TOC 카드와 같은 너비로
 * 꽉 채우지 않고 내용만큼만 차지하는 auto-width다.
 *
 * 열림/닫힘 + 배경 오버레이 + Escape 닫힘 패턴은 toc-sidebar.tsx의 모바일 드로어를 그대로
 * 재사용한다. 애니메이션은 motion/react-client가 아니라 motion/react의 m/AnimatePresence만
 * import해 components/motion-provider.tsx의 전역 LazyMotion(domAnimation)을 그대로 재사용한다.
 *
 * 017(TOC 데드존/스크롤 동작 불일치 방지) 하드 컨스트레인트 — 이 컴포넌트는 자기 자신의
 * position:sticky를 갖지 않는다. 시도 1: toc-sidebar.tsx의 `sticky top-40`과 분리된 독립 sticky
 * 요소 → 서로 다른 scrollY에 풀려(release는 top+height로 결정, 이 메뉴와 TOC의 top+height 합이
 * 다름) 스크롤 중 간격이 벌어지는 데드존 실측 재현. 시도 2: 메뉴+TOC를 하나의 공유 sticky 박스로
 * 합치고 top을 역산(160-48=112) → bottom release는 보존되지만, 그 aside 컬럼의 자연(스크롤 0)
 * 위치(~128px)가 112보다 커서 스크롤 0~20px 구간에 눈에 보이는 "따라잡기" 움직임이 생김(프로덕션은
 * 자연 위치 128px < 원래 top 160px라 스크롤 0부터 이미 고정 — 그 32px 여유가 112로 줄이면서
 * 깨짐). **최종**: 이 컴포넌트는 `app/article/[slug]/page.tsx`가 TOC의 sticky 박스(`top-40`,
 * 한 글자도 안 바뀜) *바깥 위*에 `position: absolute`로 얹는다 — 문서 흐름에 전혀 기여하지 않으므로
 * 그 박스의 top/height가 TOC 단독이었을 때와 완전히 동일하게 유지되고, "스크롤 0부터 고정"이든
 * "끝에서 풀리는 지점"이든 애초에 아무것도 안 바뀌므로 증명조차 필요 없다. */
export function CopyPageMenu({ slug }: { slug: string }) {
  const [open, setOpen] = React.useState(false)
  // fetch 실패/clipboard 거부를 조용히 삼키지 않는다(spec FR-010) — code-copy-handler.tsx의
  // 코드 블록 복사와 달리 Copy Page는 메인 동작이라, 실패해도 아무 반응이 없으면 사용자가 원인을
  // 알 방법이 없다(2982866의 "조용한 실패" 교훈과 동일).
  const [copyStatus, setCopyStatus] = React.useState<CopyStatus>("idle")
  const copyResetTimeoutRef = React.useRef<number | undefined>(undefined)

  React.useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  React.useEffect(() => {
    return () => window.clearTimeout(copyResetTimeoutRef.current)
  }, [])

  const rawMarkdownUrl = `/article/${slug}/raw`

  async function handleCopyPage() {
    try {
      const response = await fetch(rawMarkdownUrl)
      if (!response.ok) throw new Error(`raw markdown fetch failed: ${response.status}`)
      const markdown = await response.text()
      await navigator.clipboard.writeText(markdown)
      setCopyStatus("copied")
    } catch {
      setCopyStatus("error")
    } finally {
      window.clearTimeout(copyResetTimeoutRef.current)
      copyResetTimeoutRef.current = window.setTimeout(() => setCopyStatus("idle"), COPY_STATUS_RESET_MS)
    }
  }

  // resilience4j가 쓰는 것과 동일한 프롬프트 문구("Hi ChatGPT!/Claude! Can you please read [this
  // page](URL) and prepare to answer questions about it?")를 그대로 재사용한다 — origin은
  // SITE_URL(고정 프로덕션 도메인)이 아니라 window.location.origin을 쓴다(research.md §5): 지금
  // 사용자가 실제로 보고 있는 배포에서 원문을 가져올 수 있어야 하기 때문.
  function buildAiPromptUrl(service: "chatgpt" | "claude") {
    const absoluteUrl = `${window.location.origin}${rawMarkdownUrl}`
    const prompt =
      service === "chatgpt"
        ? `Hi ChatGPT! Can you please read [this page](${absoluteUrl}) and prepare to answer questions about it?`
        : `Hi Claude! Can you please read [this page](${absoluteUrl}) and prepare to answer questions about it?`
    const base = service === "chatgpt" ? "https://chat.openai.com/" : "https://claude.ai/new"
    return `${base}?q=${encodeURIComponent(prompt)}`
  }

  return (
    // 데스크탑 전용 노출(lg:block)은 이 컴포넌트를 감싸는 page.tsx의 공유 sticky 래퍼가 담당한다.
    <div className="relative inline-flex">
        <button
          type="button"
          onClick={handleCopyPage}
          aria-label={copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Copy failed" : "Copy Page"}
          className="flex h-8 items-center gap-1.5 rounded-l border border-outline-variant/20 bg-surface-container-lowest px-3 text-primary transition-colors hover:bg-surface-container-highest dark:text-primary-container"
        >
          {/* 아이콘은 고정 크기 슬롯(size-3.5) 안에서 바뀐다. 라벨 텍스트는 "Copy Page"/"Copied"/
           * "Copy failed" 세 버전을 전부 렌더링해 같은 grid 셀(`[grid-area:1/1]`)에 서로 겹쳐
           * 쌓는다 — grid 컨테이너는 암묵적으로 그 중 가장 넓은 자식 기준으로 폭이 고정되므로,
           * opacity만 토글해 보이는 텍스트를 바꿔도(실제로 "Copied"가 보여야 한다는 요구사항)
           * 버튼 폭 자체는 셋 중 가장 긴 라벨("Copy failed") 기준으로 항상 고정된다 — 레이아웃
           * 시프트 없이 텍스트가 실제로 바뀌는 두 요구사항을 동시에 만족한다. */}
          <span className="relative inline-flex size-3.5 items-center justify-center">
            {copyStatus === "copied" ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : copyStatus === "error" ? (
              <AlertCircle className="size-3.5 text-red-500" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
          </span>
          <span className="grid">
            <span
              className={`col-start-1 row-start-1 font-label-caps text-[11px] tracking-widest whitespace-nowrap transition-opacity ${copyStatus === "idle" ? "opacity-100" : "opacity-0"}`}
            >
              Copy Page
            </span>
            <span
              className={`col-start-1 row-start-1 font-label-caps text-[11px] tracking-widest whitespace-nowrap transition-opacity ${copyStatus === "copied" ? "opacity-100" : "opacity-0"}`}
              aria-hidden={copyStatus !== "copied"}
            >
              Copied
            </span>
            <span
              className={`col-start-1 row-start-1 font-label-caps text-[11px] tracking-widest whitespace-nowrap transition-opacity ${copyStatus === "error" ? "opacity-100" : "opacity-0"}`}
              aria-hidden={copyStatus !== "error"}
            >
              Copy failed
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close copy page menu" : "Open copy page menu"}
          aria-expanded={open}
          className="flex h-8 w-6 items-center justify-center rounded-r border border-l-0 border-outline-variant/20 bg-surface-container-lowest text-primary transition-colors hover:bg-surface-container-highest dark:text-primary-container"
        >
          <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        {open
          ? createPortal(
              <div aria-hidden="true" onClick={() => setOpen(false)} className="fixed inset-0 z-30" />,
              document.body
            )
          : null}

        <AnimatePresence>
          {open ? (
            <m.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-[calc(100%+0.5rem)] right-0 z-40 w-56 rounded border border-outline-variant/20 bg-surface-container-lowest p-2 shadow-xl"
            >
              <a
                href={buildAiPromptUrl("chatgpt")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left font-code-sm text-xs text-on-surface-variant transition-colors hover:text-primary dark:hover:text-primary-container"
              >
                <OpenAIIcon className="size-3.5" />
                Open in ChatGPT
              </a>
              <a
                href={buildAiPromptUrl("claude")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left font-code-sm text-xs text-on-surface-variant transition-colors hover:text-primary dark:hover:text-primary-container"
              >
                <ClaudeIcon className="size-3.5" />
                Open in Claude
              </a>
              <a
                href={rawMarkdownUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left font-code-sm text-xs text-on-surface-variant transition-colors hover:text-primary dark:hover:text-primary-container"
              >
                <MarkdownIcon className="h-3 w-4" />
                View as Markdown
              </a>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
  )
}
