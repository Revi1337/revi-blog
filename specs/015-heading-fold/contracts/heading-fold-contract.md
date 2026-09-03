# Contract: 헤딩 접기 HTML 구조 / 클라이언트 통합 지점

이 기능의 "외부 인터페이스"는 API가 아니라 (1) 빌드 타임 변환이 만들어내는 HTML 구조, (2) 그
구조에 클라이언트 3개 진입점이 어떻게 개입하는지, (3) 기존 CSS와 충돌하지 않기 위한 클래스 스코프에
대한 계약이다. 이 계약이 어긋나면 TOC/앵커 이동이 빈 화면으로 스크롤되거나, 모든 헤딩이 콜아웃처럼
박스로 보이거나, 스크린 리더가 헤딩을 못 읽는 회귀가 생기므로 tasks/구현 단계에서 그대로 지켜야
한다.

## 1. HTML 구조 계약

```html
<!-- 원본 마크다운:
## Overview
문단 A

### Detail
문단 B

## Next Section
문단 C
-->

<details open class="heading-fold" data-heading-level="2">
  <summary><h2 id="overview">Overview</h2></summary>
  <p>문단 A</p>
  <details open class="heading-fold" data-heading-level="3">
    <summary><h3 id="detail">Detail</h3></summary>
    <p>문단 B</p>
  </details>
</details>
<details open class="heading-fold" data-heading-level="2">
  <summary><h2 id="next-section">Next Section</h2></summary>
  <p>문단 C</p>
</details>
```

| 항목 | 값 | 비고 |
|---|---|---|
| 래퍼 태그 | `details` | 기본 `open` 속성 부여(spec.md FR-005) |
| 구분 클래스 | `heading-fold` | §3 CSS 스코프 분리의 기준. 콜아웃(`callout`)·raw Obsidian details와 구분 |
| 헤딩 컨테이너 | `summary` (그 헤딩 태그를 자식으로 감쌈) | 헤딩의 `id`(remark-toc.ts가 이미 부여)는 그대로 유지 — 앵커/TOC가 참조하는 id가 바뀌지 않음 |
| 중첩 | 더 깊은 하위 헤딩은 재귀적으로 중첩된 `details` | research.md §3 |
| 대상 범위 | 문서 최상위 레벨의 헤딩만 | blockquote/list 안 헤딩은 변환 대상 아님(no-op) |

**불변 조건**: 헤딩의 `id` 속성은 이 변환 전후로 절대 바뀌지 않는다 — TOC(`remark-toc.ts`가 생성한
`TocItem.id`)와 헤딩 퍼머링크(`rehype-heading-anchor.ts`가 만든 `href="#id"`)가 계속 유효해야
한다.

## 2. 클라이언트 자동 펼침 계약

```text
expandFoldAncestors(headingId: string): void
  1. document.getElementById(headingId)를 찾는다. 없으면 아무 것도 하지 않는다.
  2. 그 요소부터 closest("details")를 반복 호출해 모든 조상 <details>를 수집한다
     (가장 가까운 조상부터, document 루트까지).
  3. 수집된 모든 <details>의 .open을 true로 설정한다(이미 열려 있어도 재대입은 안전 — no-op).
```

**호출 시점 계약**: 아래 세 지점 모두 "스크롤이 실제로 실행되기 직전"에 `expandFoldAncestors`를
호출해야 한다 — 펼치기 전에 스크롤하면 목표 위치가 아직 `display:none`이라 `scrollIntoView`가
잘못된(또는 0에 가까운) 위치로 이동한다.

| 지점 | 파일 | 함수 |
|---|---|---|
| TOC 클릭 + 헤딩 퍼머링크 클릭 | `components/article/heading-scroll.ts` | `scrollToHeadingInstant(id)` 내부, `scrollIntoView` 호출 직전 |
| 초기 해시 진입 / 뒤로가기 해시 복원 | `components/article/toc-sidebar.tsx` | `restore()`의 해시 폴백 분기, `target?.scrollIntoView()` 직전 |

**불변 조건**: `expandFoldAncestors`는 대상 헤딩이 속하지 않은 다른 `<details>`의 `open` 상태를
건드리지 않는다(spec.md 요구사항 3 — 상태 독립성).

## 3. CSS 스코프 분리 계약

**[amended, 실측 후 정정 — research.md §8]** 헤딩 접기는 쉐브론/박스 등 어떤 시각적 표식도 갖지
않는다(사용자 피드백 — 기존 화면과 완전히 동일해야 함). `<details class="heading-fold">`/
`<summary>` 둘 다 자기 자신의 박스 모델(margin/border/background/padding)을 전혀 갖지 않는다.

```text
콜아웃 전용 규칙(app/article-body.css:676-717 인근)은 `details:not(.heading-fold) > ...`로
`.heading-fold`를 명시적으로 배제한다 — 반대로 `.heading-fold` 쪽에 별도의 `*:not(summary) {
padding: 0 }` 같은 보정 규칙을 넣지 않는다(실측으로 발견한 회귀: 이런 보정 규칙이 중첩된
callout-comeau처럼 자체 padding을 가진 자식의 스타일까지 덮어써 버렸다, research.md §8).

.article-body details.heading-fold           →  margin/border/border-radius/background 없음,
                                                 overflow: visible(필수 — 콜아웃 공용 규칙의
                                                 overflow: hidden을 반드시 되돌려야 한다. 안
                                                 그러면 새 BFC가 생겨 마진 collapse가 막히고,
                                                 음수 위치의 콜아웃 배지 아이콘이 잘린다)
.article-body details.heading-fold > summary →  display: block, padding 0, font/color inherit,
                                                 쉐브론 없음(헤딩이 원래 폭 그대로 렌더링되어
                                                 h2::after 밑줄 구분선도 원래 길이 그대로 유지됨)
.article-body h2:first-child                 →  구조가 한 단계 깊어지면서(summary의 유일한
                                                 자식) 의도와 다르게 모든 h2에 매치되므로
                                                 `.article-body > details.heading-fold:first-child
                                                 > summary > h2:first-child`로 좁혀야 한다
```

**감사 방법(4차 정정에서 확립)**: `.heading-fold`가 `.article-body details`/`summary`의 선언
속성을 빠짐없이 되돌렸는지는 스크린샷 몇 장이 아니라, 두 공용 규칙이 선언하는 **모든 속성을
나열**해 하나씩 대조해야 한다 — margin/overflow/border-radius/border/background-color(details),
display/align-items/gap/padding/list-style/cursor/font-family/font-size/font-weight/color
(summary). `:first-child`처럼 DOM 계층 변화로 의미가 바뀌는 구조적 셀렉터도 전체 CSS 파일에서
재검색해야 한다.

**불변 조건**: `heading-fold` 클래스가 붙지 않은 기존 `<details>`(콜아웃, raw Obsidian
details/summary)의 시각적 결과는 이번 변경으로 달라지지 않는다(회귀 없음 — spec.md FR-014와 같은
원칙을 CSS 레벨에도 적용). 또한 `.heading-fold`의 자식 콘텐츠(문단/다이어그램/표/중첩 콜아웃 등)도
각자 원래 갖고 있던 자체 CSS(margin/padding)를 그대로 유지해야 한다 — 헤딩 접기 쪽에서 자식에게
새로운 padding/margin 규칙을 얹지 않는다.

## 4. 다이어그램 핸들러 — 변경 없음 계약 / TOC 스크롤스파이 — 최소 보강 계약

`components/article/mermaid-diagram-handler.tsx`, `components/article/plantuml-diagram-handler.tsx`,
`components/article/markmap-diagram-handler.tsx`는 **수정하지 않는다**(research.md §6). 구현 중 이
파일들을 건드릴 필요가 생겼다면, 그것은 이 계약이 깨졌다는 신호이므로 먼저 research.md §6의 전제가
실제로 맞는지 재확인해야 한다.

**[amended, 실측으로 정정]** `toc-sidebar.tsx`의 스크롤스파이 필터는 애초 "수정 불필요"로 결정했으나,
`offsetParent !== null`만으로는 닫힌 `<details>` 안 헤딩을 감지하지 못한다는 것이 playwright 실측으로
드러나(research.md §7) 최소한의 보강이 필요하다:

```text
변경 전: headings.filter((heading) => heading.offsetParent !== null)
변경 후: headings.filter(
  (heading) => heading.offsetParent !== null && heading.closest("details:not([open])") === null
)
```

이 한 줄 조건 추가 외에 `updateActiveHeading`의 나머지 로직(스크롤 위치 비교, `activeId` 결정)은
건드리지 않는다 — 그 이상의 변경이 필요해 보이면 이 계약이 깨졌다는 신호다.
