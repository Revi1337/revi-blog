# Quickstart: Markdown Extended Syntax 검증

이 기능이 실제로 동작하는지 로컬에서 확인하는 절차. constitution.md Principle I(빌드 + 실제
렌더링 구동으로 검증)을 따르되, 이번 피처는 검증 수단으로 `claude-in-chrome`을 사용한다(사용자
지정).

## Prerequisites

- `lib/content/pipeline.ts`에 6개 문법의 remark/rehype 플러그인이 모두 등록되어 있어야 한다.
- `package.json`에 `remark-math`, `rehype-katex`, `katex`가 설치되어 있어야 한다.

## 1. 6개 문법을 모두 포함한 검증용 아티클 작성

```bash
cat > content/articles/_syntax-preview.md <<'EOF'
---
title: "Syntax Preview (내부 검증용)"
category: "TEST"
publishedAt: "2026-07-20"
tags: ["TEST"]
showOnHomepage: false
---

## 콜아웃

> [!NOTE]
> 기본 노트 콜아웃

> [!WARNING]- 접힌 경고
> 클릭하면 펼쳐진다

> [!IMPORTANT]
> GitHub Alert 별칭이 옵시디언 콜아웃과 동일하게 렌더링되는지 확인

## 수식

인라인 $O(n \log n)$ 그리고 블록:

$$
\sum_{i=1}^{n} x_i
$$

깨진 수식도 페이지를 죽이지 않아야 한다: $\frac{1}{$

## 하이라이트와 주석

이 문장은 ==반드시 강조==되어야 하고, `==코드 안은 그대로==`여야 한다.

공개 문장. %%이 메모는 절대 보이면 안 됨%% 다음 공개 문장.

#### h4 레벨 소제목 (TOC에는 안 나타나야 함)

<details>
<summary>접기/펼치기</summary>
디자인 톤이 콜아웃 접기와 통일되어야 한다.
</details>
EOF

npm run build
```

**Expected**: 빌드 성공(수식 오류가 있어도 빌드가 실패하지 않아야 함 — FR-015).

## 2. 다크/라이트 각 문법 시각 확인 (User Story 1~4, Constitution Principle II)

```bash
npm run dev   # http://localhost:3999
```

`claude-in-chrome`으로:
1. `/article/_syntax-preview` (또는 실제 slug)로 이동
2. 라이트 테마에서 스크린샷 — 콜아웃 3종(NOTE/WARNING 접힘/IMPORTANT)이 타입별로 구분되는 색/아이콘을
   가지는지, 수식이 조판되어 보이는지, 하이라이트 배경이 보이는지, `%%...%%` 메모가 어디에도
   노출되지 않는지 확인
3. 테마 토글로 다크 전환 후 다시 스크린샷 — 동일 항목이 다크 모드에서도 대비를 유지하는지 확인
4. `WARNING` 콜아웃을 클릭해 펼침/접힘 전환이 되는지 확인
5. 브라우저 콘솔에 하이드레이션/렌더링 에러가 없는지 확인

## 3. 전헤딩 앵커 딥링크 확인 (User Story 5)

1. 페이지 소스에서 h4("h4 레벨 소제목") 요소에 `id` 속성이 부여되어 있는지 확인
2. `/article/_syntax-preview#h4-레벨-소제목-toc에는-안-나타나야-함` 같은 URL로 직접 접속해 해당
   위치로 스크롤되는지 확인
3. 사이드바 TOC 목록에는 "콜아웃"/"수식"/"하이라이트와 주석" (h2)만 보이고, h4 항목은 목록에
   추가되지 않았는지 확인

## 4. 주석 비노출 검증 (User Story 4, FR-008)

```bash
curl -s http://localhost:3999/article/_syntax-preview | grep -c "이 메모는 절대 보이면 안 됨"
# 0이어야 한다
```

## 5. 회귀 확인 (SC-004)

- 기존 7개 아티클(`content/articles/architecting-...` 등, `_syntax-preview.md` 제외) 상세 페이지를
  각각 열어 콜아웃/수식/하이라이트/주석 관련 UI가 새로 생기지 않았는지(즉 신규 플러그인이 기존
  콘텐츠에 대해 no-op인지) 확인
- 홈 페이지(`/`)에 `_syntax-preview`가 노출되지 않는지 확인(`showOnHomepage: false`)

## 6. 정리

```bash
rm content/articles/_syntax-preview.md
```

검증용 아티클은 발행 콘텐츠가 아니므로, 시각 확인이 끝나면 삭제하거나(권장) 저장소에 영구
보존할지는 `/speckit-tasks` 단계에서 별도 태스크로 결정한다.
