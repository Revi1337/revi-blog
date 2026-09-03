# Quickstart: 헤딩 접기/펼치기 검증 가이드

이 저장소에는 자동화 테스트가 없다(constitution.md Principle I). 아래는 구현 완료 후
`npm run build` + `playwright-cli`로 실제 브라우저에서 확인할 수동 검증 시나리오다. 구체적 태스크
단위 분해는 `/speckit-tasks`가 담당하며, 여기서는 "무엇을 어떻게 준비하고 무엇이 보이면 성공인지"만
정의한다.

## 0. 준비 — 검증용 콘텐츠

기존에 다이어그램 검증용으로 이미 존재하는 `content/articles/_diagram.md`(`show_on_homepage: false`,
014에서 만든 내부 검증 전용 아티클) 패턴을 그대로 따른다. 이 아티클에 아래 조건을 만족하는 섹션을
추가하거나, 별도의 `content/articles/_heading-fold.md`를 새로 만든다:

- H2 → H3 → H4까지 3단계로 중첩된 헤딩 (각 레벨 접기가 하위를 포함해서 접히는지 확인용)
- 서로 다른 H2 섹션 두 개 (독립적 접힘 상태 확인용)
- 다이어그램(Mermaid든 PlantUML이든 Markmap이든 하나) 을 포함한 H2 섹션 (다이어그램 영향 없음 확인용)
- 코드 블록/이미지/표/콜아웃을 섞은 H2 섹션 (콘텐츠 종류 무관 정상 동작 확인용)

**⚠️ `content/articles/**` 편집은 `next dev`를 재시작해야 반영된다** —
`lib/data/articles.ts`의 top-level `await`가 프로세스 생애주기 동안 1회만 마크다운을 읽어
캐싱하기 때문(constitution.md Principle I). 이 아티클을 수정할 때마다 서버를 재시작할 것.

## 1. User Story 1 (P1) — 기본 토글

```bash
npm run build   # 또는 next dev 재시작 후
```

`playwright-cli`로 검증 아티클 페이지를 열고:

1. 임의의 H2 헤딩 옆(또는 헤딩 자체)의 토글을 클릭 → 그 헤딩부터 다음 H2 직전까지(하위 H3/H4
   포함)의 콘텐츠가 화면에서 사라지는지 확인.
2. 같은 토글을 다시 클릭 → 콘텐츠가 원래대로 돌아오는지 확인.
3. 서로 다른 H2 두 개 중 하나만 접고, 다른 하나는 펼쳐진 채로 남아 있는지 확인.
4. 페이지를 새로고침 → 모든 헤딩이 다시 펼쳐진 기본 상태로 보이는지 확인.

**성공 기준**: spec.md Acceptance Scenarios 1~4 (User Story 1) 전부 통과.

## 2. User Story 2 (P2) — TOC/앵커/뒤로가기 자동 펼침

1. H3 헤딩이 있는 H2 섹션을 접는다.
2. 그 H3을 가리키는 TOC 항목을 클릭 → H2 섹션이 자동으로 펼쳐지고 H3 위치로 스크롤되는지 확인.
3. 같은 H3의 URL(`.../article/_heading-fold#해당-id`)을 새 탭에서 직접 열기(또는 주소창에 해시
   붙여 진입) → 처음부터 펼쳐진 상태로 로드되는지 확인.
4. 그 섹션을 접은 뒤 다른 페이지로 이동했다가 브라우저 뒤로가기로 복귀 → 섹션이 펼쳐진 채로
   콘텐츠가 보이는지 확인.

**성공 기준**: spec.md Acceptance Scenarios 1~3 (User Story 2) 전부 통과.

## 3. User Story 3 (P3) — 키보드/접근성

1. 마우스를 쓰지 않고 Tab 키만으로 헤딩 토글에 포커스를 이동한 뒤 Enter/Space로 접고 펼쳐지는지
   확인.
2. 스크린 리더(macOS VoiceOver 등, 가능한 환경에서)로 토글 상태 변화가 공지되는지 확인.

**성공 기준**: spec.md Acceptance Scenarios 1~2 (User Story 3) 전부 통과.

## 4. 회귀 확인

- 다이어그램이 포함된 H2 섹션을 접었다 펼쳤을 때 다이어그램이 깨지지 않고 온전한 모습으로
  다시 나타나는지 확인(SC-005).
- 콜아웃(`> [!note]-`)이 포함된 아티클에서 콜아웃의 기존 접기/펼치기 동작과 시각 스타일이 이번
  변경 이전과 동일한지 확인(§contracts/heading-fold-contract.md #3 — CSS 스코프 분리 계약).
- 이번 변경 이전에 발행된 임의의 기존 아티클(다이어그램 없는 일반 글 포함) 1~2개를 열어 렌더링
  결과가 기존과 동일한지 확인(SC-007).
