---

description: "Task list template for feature implementation"
---

# Tasks: Markdown Extended Syntax

**Input**: Design documents from `/specs/004-markdown-extended-syntax/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/pipeline-plugins.md, quickstart.md

**Tests**: 이 저장소는 자동화 테스트 스위트가 없다(constitution.md Principle I). 검증은 각 스토리
마지막에 `npm run build` + quickstart.md의 `claude-in-chrome` 실제 렌더링 확인으로 대체한다 —
별도 테스트 태스크는 생성하지 않는다.

**Organization**: 6개 User Story(P1~P6, spec.md 우선순위 순)별로 태스크를 그룹화했다. 각 스토리는
`lib/content/pipeline.ts`에 자기 플러그인을 등록하는 한 줄 외에는 독립된 파일만 건드리므로 개별
검증이 가능하다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 미완료 태스크에 의존하지 않음)
- **[Story]**: 이 태스크가 속한 User Story (US1~US6)
- 모든 태스크에 정확한 파일 경로 포함

## Path Conventions

단일 Next.js 프로젝트. 모든 경로는 저장소 루트 기준.

---

## Phase 1: Setup

**Purpose**: 신규 의존성 설치

- [X] T001 `package.json`에 `remark-math`, `rehype-katex`, `katex`를 dependencies로 추가하고
      `npm install` 실행

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공유하는 검증용 콘텐츠 스캐폴드 준비

**⚠️ CRITICAL**: 이 단계 완료 전에는 어떤 User Story 작업도 시작하지 않는다

- [X] T002 `content/articles/_syntax-preview.md`를 frontmatter만 채운 스켈레톤으로 생성
      (`title`, `category`, `publishedAt`, `tags`, `showOnHomepage: false`) — 이후 각 User Story가
      자신의 섹션을 이 파일에 추가한다 (quickstart.md 1절 참고)

**Checkpoint**: 스캐폴드 준비 완료 — User Story 구현 시작 가능

---

## Phase 3: User Story 1 - 콜아웃으로 핵심 정보 강조 (Priority: P1) 🎯 MVP

**Goal**: `> [!TYPE]` blockquote를 타입별 아이콘/강조색을 가진 콜아웃 박스로 렌더링하고, GitHub
Alerts 5종을 동일 컴포넌트로 매핑하며, `-`/`+`로 접기 상태를 제어한다.

**Independent Test**: `_syntax-preview.md`에 콜아웃 3종만 넣고 빌드 후 `claude-in-chrome`으로
다크/라이트 각각 확인 — 다른 스토리 구현 없이도 완결된 검증이 가능.

### Implementation for User Story 1

- [X] T003 [P] [US1] `lib/content/plugins/remark-callout.ts` 신규 작성 — `blockquote` mdast 노드의
      첫 문단이 `/^\[!(\w+)\]([-+])?(?:\s+(.*))?$/`에 매치하면 콜아웃 hast로 치환. 10종 타입
      (note/tip/warning/danger/info/success/question/bug/example/quote) + GitHub Alerts 별칭
      (NOTE/TIP/IMPORTANT/WARNING/CAUTION) 매핑 테이블, 아이콘 SVG path 상수, 미상 타입 시
      `note` 폴백(라벨은 원본 유지) 포함. 매치되지 않는 blockquote는 그대로 반환(no-op)
- [X] T004 [US1] `lib/content/pipeline.ts`에 `remarkCallout()`을 `remark-gfm` 이후,
      `remarkRehype` 이전 위치에 등록 (T003 완료 후)
- [X] T005 [P] [US1] `app/globals.css`에 `.article-body` 콜아웃 박스 + `<details>`/`<summary>`
      기본 스타일을 다크(`.dark .article-body ...`)/라이트 셀렉터 쌍으로 추가 (10개 타입별
      강조색, 접기 화살표 회전 애니메이션)
- [X] T006 [US1] `content/articles/_syntax-preview.md`에 콜아웃 예시 3종(NOTE 기본, `WARNING-`
      접힘, GitHub `IMPORTANT` 별칭) 섹션 추가 (T002, T003 완료 후)
- [X] T007 [US1] `npm run build` 실행 후 quickstart.md 2절에 따라 `claude-in-chrome`으로
      다크/라이트 각각 콜아웃 3종의 색상/아이콘 구분과 접기/펼치기 클릭 동작 확인

**Checkpoint**: 콜아웃 기능이 독립적으로 완결되어 배포 가능

---

## Phase 4: User Story 2 - 수식이 포함된 기술 문서 정확히 표현 (Priority: P2)

**Goal**: `$인라인$`/`$$블록$$` 수식을 KaTeX로 조판하고, 구문 오류 시 페이지 전체가 깨지지 않고
원본 텍스트를 표시한다.

**Independent Test**: `_syntax-preview.md`에 정상 수식 2종 + 깨진 수식 1종만 넣고 빌드 성공
여부와 렌더링 결과를 `claude-in-chrome`으로 확인 — US1과 독립적으로 검증 가능.

### Implementation for User Story 2

- [X] T008 [US2] `lib/content/pipeline.ts`에 `remark-math`(remark-gfm 이후)와
      `rehype-katex`(rehype-pretty-code 이후, `{ throwOnError: false, errorColor:
      "var(--color-error)" }` 옵션)를 등록 (T004 완료 후 — 같은 파일 순차 수정)
- [X] T009 [P] [US2] `app/globals.css`에 `katex/dist/katex.min.css` import 추가하고, `.katex`
      스코프에 한정된 다크/라이트 텍스트 색상 오버라이드 정의 (AGENTS.md 폰트 규칙 예외 범위를
      주석으로 명시)
- [X] T010 [US2] `content/articles/_syntax-preview.md`에 인라인 수식(`$O(n \log n)$`), 블록 수식
      (`$$\sum...$$`), 의도적으로 깨진 수식(`$\frac{1}{$`) 섹션 추가 (T002 완료 후)
- [X] T011 [US2] `npm run build`로 빌드 성공(깨진 수식 포함해도 실패하지 않음) 확인 후
      quickstart.md 2절에 따라 `claude-in-chrome`으로 다크/라이트 수식 조판과 깨진 수식의
      원본 텍스트 폴백 표시 확인

**Checkpoint**: US1 + US2가 각각 독립적으로 동작

---

## Phase 5: User Story 3 - 본문 내 핵심 문구 시각적으로 강조 (Priority: P3)

**Goal**: `==text==`를 `<mark>`로 렌더링하되 코드 스팬/코드 블록 내부는 변환하지 않는다.

**Independent Test**: `_syntax-preview.md`에 일반 하이라이트 1개 + 코드 스팬 안의 `==a==` 1개만
넣고 후자가 변환되지 않는지 확인 — 독립적으로 검증 가능.

### Implementation for User Story 3

- [X] T012 [P] [US3] `lib/content/plugins/remark-highlight.ts` 신규 작성 — `text` mdast 노드만
      방문해 `/==([^=]+)==/g`로 분리 후 매치 구간을 `<mark>` hast로 치환. `==`가 없는 텍스트
      노드는 그대로 반환(no-op)
- [X] T013 [US3] `lib/content/pipeline.ts`에 `remarkHighlight()` 등록 (T008 완료 후 — 같은 파일
      순차 수정)
- [X] T014 [P] [US3] `app/globals.css`에 `.article-body mark` 다크/라이트 배경색 쌍 추가
- [X] T015 [US3] `content/articles/_syntax-preview.md`에 `이 문장은 ==강조==되어야 한다`와
      `` `==코드 안은 그대로==` `` 섹션 추가 (T002 완료 후)
- [X] T016 [US3] `npm run build` 후 quickstart.md 2절에 따라 `claude-in-chrome`으로 다크/라이트
      하이라이트 배경 대비 확인 및 코드 스팬 내부 `==...==` 미변환 확인

**Checkpoint**: US1~US3가 각각 독립적으로 동작

---

## Phase 6: User Story 4 - 저작 시점의 메모를 독자에게 노출하지 않기 (Priority: P4)

**Goal**: `%%text%%`(및 미종료 시 EOF까지)를 렌더링 결과에서 완전히 제거한다.

**Independent Test**: `_syntax-preview.md`에 비공개 메모 1개를 문장 중간에 넣고, 빌드된 HTML을
`curl | grep`으로 검색해 텍스트가 전혀 없음을 확인 — 독립적으로 검증 가능.

### Implementation for User Story 4

- [X] T017 [P] [US4] `lib/content/strip-comments.ts` 신규 작성 — `stripComments(rawBody: string):
      string`. `/%%[\s\S]*?%%/g`로 닫힌 쌍 제거 후 `/%%[\s\S]*$/`로 미종료 잔여분 제거. `%%`가
      없으면 입력 그대로 반환(no-op)
- [X] T018 [US4] `lib/content/loader.ts`의 `renderMarkdown(rawBody)` 호출을
      `renderMarkdown(stripComments(rawBody))`로 교체 (T017 완료 후)
- [X] T019 [US4] `content/articles/_syntax-preview.md`에 `공개 문장. %%비공개 메모%% 다음 공개
      문장.` 섹션 추가 (T002 완료 후)
- [X] T020 [US4] `npm run build && npm run dev` 후 quickstart.md 4절의
      `curl http://localhost:3999/article/_syntax-preview | grep` 명령으로 비공개 메모 텍스트가
      결과에 0건인지 확인

**Checkpoint**: US1~US4가 각각 독립적으로 동작

---

## Phase 7: User Story 5 - 특정 섹션으로 바로 이동하는 링크 공유 (Priority: P5)

**Goal**: h1~h6 전체 헤딩에 앵커 id를 부여하되, TOC 목록은 h2/h3만 유지한다.

**Independent Test**: `_syntax-preview.md`에 h4 소제목 1개를 넣고 해당 id로의 딥링크 스크롤과
TOC 목록 미노출을 확인 — 독립적으로 검증 가능.

### Implementation for User Story 5

- [X] T021 [US5] `lib/content/plugins/remark-toc.ts` 수정 — `hProperties.id` 부여를 모든
      heading depth로 확장하되, `items.push(...)`(TOC 배열 수집)는 depth 2/3 조건 안에만 유지
      (동일 `slugger` 인스턴스·단일 패스 유지)
- [X] T022 [US5] `content/articles/_syntax-preview.md`에 `#### h4 레벨 소제목` 섹션 추가 (T002
      완료 후)
- [X] T023 [US5] `npm run build && npm run dev` 후 quickstart.md 3절에 따라 h4 요소의 `id` 속성
      존재, 해당 URL 해시로 접속 시 스크롤 이동, TOC 목록에 h4 미노출을 `claude-in-chrome`으로
      확인

**Checkpoint**: US1~US5가 각각 독립적으로 동작

---

## Phase 8: User Story 6 - 옵시디언 원고의 접이식 섹션이 시각적으로 자연스럽게 표시 (Priority: P6)

**Goal**: raw `<details>`/`<summary>`가 기존 디자인 톤(다크/라이트)과 일관되게 보이도록 스타일만
다듬는다. 코드 변경 없음 — 이미 `allowDangerousHtml: true`로 동작 중.

**Independent Test**: `_syntax-preview.md`에 독립된 `<details>` 블록 하나만 넣고 다크/라이트에서
디자인 일관성을 눈으로 확인 — 독립적으로 검증 가능. (T005에서 기본 스타일이 이미 추가되었다면
이 스토리는 미세 조정만 남을 수 있다.)

### Implementation for User Story 6

- [X] T024 [P] [US6] `app/globals.css`의 `.article-body details`/`summary` 스타일을 검토해
      콜아웃(T005)과 시각 톤이 통일되는지 확인하고 필요한 다크/라이트 미세 조정 반영
- [X] T025 [US6] `content/articles/_syntax-preview.md`에 콜아웃과 무관한 독립 `<details>` 예시
      섹션 추가 (T002 완료 후)
- [X] T026 [US6] `npm run build` 후 quickstart.md 2절에 따라 `claude-in-chrome`으로 다크/라이트
      각각 접기/펼치기 UI가 본문 디자인과 자연스럽게 어울리는지 확인

**Checkpoint**: 6개 User Story 모두 독립적으로 동작

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 전체 통합 검증 및 회귀 확인

- [X] T027 `npm run build && npm run dev` 후 quickstart.md 전체(1~5절)를 처음부터 끝까지 실행해
      6개 문법이 `_syntax-preview.md` 한 페이지 안에서 함께 있어도 서로 간섭하지 않는지
      `claude-in-chrome`으로 최종 확인 (모든 US 완료 후)
- [X] T028 기존 7개 발행 아티클(`content/articles/architecting-...` 등, `_syntax-preview.md`
      제외) 상세 페이지를 각각 열어 신규 콜아웃/수식/하이라이트/details 스타일이 의도치 않게
      나타나지 않는지 확인 (SC-004 회귀 확인)
- [X] T029 `content/articles/_syntax-preview.md`를 `showOnHomepage: false` 고정 검증용 픽스처로
      저장소에 유지할지, 검증 후 삭제할지 결정하고 반영

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 — 모든 User Story를 막는 전제조건
- **User Stories (Phase 3~8)**: 모두 Foundational 완료를 전제하며, 우선순위 순(P1→P6)으로
  순차 진행 권장. 단, `lib/content/pipeline.ts`를 스토리마다 순차 수정하므로(T004→T008→T013)
  이 파일에 한해서는 실제로 순서를 지켜야 한다 — 그 외 파일은 스토리 간 완전히 독립적이다.
- **Polish (Phase 9)**: 원하는 모든 User Story 완료 후

### Within Each User Story

- 플러그인/유틸 구현 → `pipeline.ts`(또는 `loader.ts`) 등록 → 검증용 콘텐츠 추가 → 빌드+브라우저 확인
- 각 스토리 완료 후 다음 우선순위로 이동

### Parallel Opportunities

- T003(callout 플러그인)과 T005(globals.css 콜아웃 스타일)는 서로 다른 파일이라 병렬 가능
- 각 스토리의 "플러그인/유틸 구현" 태스크와 "CSS 스타일" 태스크는 서로 다른 파일이므로 병렬 가능
  (예: T012 ↔ T014, T017 ↔ 해당 스토리에 CSS 태스크 없음)
- `pipeline.ts`/`loader.ts`를 건드리는 태스크(T004, T008, T013, T018, T021)는 같은 파일을
  누적 수정하므로 병렬 불가 — 반드시 스토리 우선순위 순으로 순차 실행

---

## Parallel Example: User Story 1

```bash
# T003과 T005를 동시에 진행 가능 (서로 다른 파일)
Task: "lib/content/plugins/remark-callout.ts 신규 작성"
Task: "app/globals.css에 콜아웃/details 기본 스타일 추가"

# 두 태스크 완료 후 순차로
Task: "pipeline.ts에 remarkCallout 등록 (T003 의존)"
Task: "_syntax-preview.md에 콜아웃 예시 추가 (T003 의존)"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료
3. Phase 3: User Story 1(콜아웃) 완료
4. **STOP and VALIDATE**: quickstart.md 2절로 콜아웃만 독립 검증
5. 필요 시 여기서 배포/데모 — 콜아웃이 이번 기능 요청의 출발점이었던 만큼 단독으로도 가치가 있다

### Incremental Delivery

1. Setup + Foundational → 스캐폴드 준비
2. US1(콜아웃) 추가 → 독립 검증 → MVP
3. US2(수식) 추가 → 독립 검증
4. US3(하이라이트) 추가 → 독립 검증
5. US4(주석) 추가 → 독립 검증
6. US5(전헤딩앵커) 추가 → 독립 검증
7. US6(details 스타일링) 추가 → 독립 검증
8. Polish(Phase 9)로 전체 통합 + 회귀 확인 마무리

---

## Notes

- [P] 태스크 = 서로 다른 파일, 미완료 의존성 없음
- `pipeline.ts`/`loader.ts`는 스토리마다 누적 수정되는 공유 파일이므로, 표시된 순서(T004→T008→
  T013→T018→T021)를 반드시 지킨다
- 각 User Story는 독립적으로 완결·검증 가능하도록 설계됨 — Avoid: 스토리 간 교차 의존성으로
  독립성이 깨지는 것
- 테스트 태스크 없음(자동화 테스트 스위트 부재) — 각 스토리 마지막 태스크가 quickstart.md 기반
  실빌드+실브라우저 검증을 대신한다(constitution.md Principle I)
