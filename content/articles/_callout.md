---
title: Callout Preview (내부 검증용)
date: 2026-09-04 00:00
tags:
  - TEST
show_on_homepage: false
---

## 일반 Callout — `[#TYPE]`

> [#NOTE]
> Note 콜아웃입니다. 참고할 만한 부가 정보를 담습니다.

> [#TIP]
> Tip 콜아웃입니다. 더 나은 방법이나 팁을 제안할 때 씁니다.

> [#WARNING]
> Warning 콜아웃입니다. 주의가 필요한 내용을 강조합니다.

> [#DANGER]
> Danger 콜아웃입니다. 위험하거나 되돌리기 어려운 작업을 경고합니다.

> [#INFO]
> Info 콜아웃입니다. 일반적인 정보 전달에 사용합니다.

> [#SUCCESS]
> Success 콜아웃입니다. 성공적으로 완료된 작업이나 긍정적인 결과를 나타냅니다.

> [#QUESTION]
> Question 콜아웃입니다. 질문이나 FAQ 형태의 내용에 사용합니다.

> [#BUG]
> Bug 콜아웃입니다. 알려진 버그나 이슈를 기록할 때 사용합니다.

> [#EXAMPLE]
> Example 콜아웃입니다. 예시 코드나 사용 사례를 보여줄 때 사용합니다.

> [#QUOTE]
> Quote 콜아웃입니다. 인용문이나 출처가 있는 내용을 표시합니다.

> [#IMPORTANT]
> Important 콜아웃입니다. 반드시 알아야 할 핵심 내용을 강조합니다.

> [#COLLAPSE]
> Collapse 타입입니다. 전용 강조색 없이 중립 회색(--color-outline-variant)으로 렌더링됩니다.

> [#ABSTRACT]
> Abstract 콜아웃입니다. Obsidian 기본 콜아웃 13종 중 우리에게 없던 타입 — 요약/TL;DR 내용에 사용합니다.

> [#TODO]
> Todo 콜아웃입니다. Obsidian 기본 콜아웃 13종 중 우리에게 없던 타입 — 해야 할 일 목록에 사용합니다.

> [#FAILURE]
> Failure 콜아웃입니다. Obsidian 기본 콜아웃 13종 중 우리에게 없던 타입 — danger와 의미는 가깝지만 "실패한 상태"를 나타낼 때 사용합니다.

### 별칭(alias) 확인

> [#CAUTION]
> caution — warning의 별칭입니다(Obsidian 기준 — 기존엔 danger로 잘못 매핑돼 있었음).

> [#HINT]
> hint — tip의 별칭입니다.

> [#CHECK]
> check — success의 별칭입니다.

> [#DONE]
> done — success의 별칭입니다.

> [#HELP]
> help — question의 별칭입니다.

> [#FAQ]
> faq — question의 별칭입니다.

> [#ATTENTION]
> attention — warning의 별칭입니다.

> [#ERROR]
> error — danger의 별칭입니다.

> [#CITE]
> cite — quote의 별칭입니다.

> [#SUMMARY]
> summary — abstract의 별칭입니다.

> [#TLDR]
> tldr — abstract의 별칭입니다.

> [#FAIL]
> fail — failure의 별칭입니다.

> [#MISSING]
> missing — failure의 별칭입니다.

### 커스텀 타이틀

> [#TIP] 커스텀 타이틀 예시
> 대괄호 뒤에 텍스트를 붙이면 헤더 타이틀이 타입명 대신 이 텍스트로 대체됩니다.

### 접기/펼치기

> [#NOTE]-
> 이 콜아웃은 `-` 마커로 인해 기본적으로 접힌 상태(collapsed)로 시작합니다.

> [#WARNING]+
> 이 콜아웃은 `+` 마커로 인해 기본적으로 펼쳐진 상태(expanded)로 시작합니다.

### 여러 줄 / 블록 포함

> [#EXAMPLE] 코드가 포함된 예시
> 콜아웃 본문에는 여러 문단과 코드 블록을 포함할 수 있습니다.
>
> ```ts
> function greet(name: string) {
>   return `hello, ${name}`
> }
> ```
>
> 마지막 문단입니다.

---

## Custom 스타일 Callout — `[!TYPE]`

> [!NOTE]
> Note 콜아웃입니다. joshwcomeau.com 스타일의 좌측 곡선 장식이 특징입니다.

> [!TIP]
> Tip 콜아웃입니다.

> [!WARNING]
> Warning 콜아웃입니다. 다른 타입과 달리 더 날카로운 "alert" 곡선을 사용합니다.

> [!DANGER]
> Danger 콜아웃입니다.

> [!INFO]
> Info 콜아웃입니다.

> [!SUCCESS]
> Success 콜아웃입니다.

> [!QUESTION]
> Question 콜아웃입니다. 일반 콜아웃과 동기화된 타입입니다.

> [!BUG]
> Bug 콜아웃입니다. 일반 콜아웃과 동기화된 타입입니다.

> [!EXAMPLE]
> Example 콜아웃입니다. 일반 콜아웃과 동기화된 타입입니다.

> [!QUOTE]
> Quote 콜아웃입니다.

> [!IMPORTANT]
> Important 콜아웃입니다. 일반 콜아웃과 동기화된 타입입니다.

> [!COLLAPSE]
> Collapse 타입입니다. 전용 강조색 없이 중립 회색(--color-outline-variant)으로 렌더링됩니다.

> [!ABSTRACT]
> Abstract 콜아웃입니다. 일반 콜아웃과 동기화된 타입입니다.

> [!TODO]
> Todo 콜아웃입니다. 일반 콜아웃과 동기화된 타입입니다.

> [!FAILURE]
> Failure 콜아웃입니다. 일반 콜아웃과 동기화된 타입입니다.

### 별칭(alias) 확인

> [!CAUTION]
> caution — warning의 별칭입니다(Obsidian 기준 — 기존엔 danger로 잘못 매핑돼 있었음).

> [!HINT]
> hint — tip의 별칭입니다.

> [!CHECK]
> check — success의 별칭입니다.

> [!DONE]
> done — success의 별칭입니다.

> [!HELP]
> help — question의 별칭입니다.

> [!FAQ]
> faq — question의 별칭입니다.

> [!ATTENTION]
> attention — warning의 별칭입니다.

> [!ERROR]
> error — danger의 별칭입니다.

> [!CITE]
> cite — quote의 별칭입니다.

> [!SUMMARY]
> summary — abstract의 별칭입니다.

> [!TLDR]
> tldr — abstract의 별칭입니다.

> [!FAIL]
> fail — failure의 별칭입니다.

> [!MISSING]
> missing — failure의 별칭입니다.

### 커스텀 타이틀

> [!TIP] 커스텀 타이틀 예시
> Custom 스타일도 동일하게 커스텀 타이틀을 지정할 수 있습니다.

### 접기/펼치기

> [!NOTE]- 접힌 채로 시작
> 이 콜아웃은 접힌 상태로 시작합니다. `<details>`/`<summary>`로 렌더링됩니다.

> [!WARNING]+ 펼쳐진 채로 시작
> 이 콜아웃은 펼쳐진 상태로 시작합니다.

> [!COLLAPSE]- 순수 접기 섹션
> 특정 의미 없이 그냥 접히는 섹션이 필요할 때 이 타입을 사용합니다.

### 여러 줄 / 블록 포함

> [!DANGER] 코드가 포함된 예시
> Custom 스타일 본문에도 여러 문단과 코드 블록을 포함할 수 있습니다.
>
> ```ts
> throw new Error("치명적인 오류")
> ```
>
> 마지막 문단입니다.

---

## 좁은 컨테이너에서의 폴백 바 확인용

> [!WARNING] 컨테이너 쿼리 폴백
> 컨테이너 폭이 좁아지면 좌측 rail/badge 대신 단순 바(fallback-bar)로 전환됩니다. 이 문서에서는 직접 확인하려면 뷰포트/컨테이너 폭을 줄여보세요.

---

## 중첩(nested) Callout 확인

Obsidian은 `>` 개수를 늘려 콜아웃을 중첩할 수 있음(공식 문서 예시: question > todo > example). 우리 파서/CSS가 이걸 지원하는지 확인.

### 일반 Callout 2단 중첩

> [#QUESTION] 중첩이 되나요?
> 네, 될 수도 있습니다.
> > [#TODO] 안쪽 콜아웃
> > 이건 바깥 QUESTION 콜아웃 안에 중첩된 TODO 콜아웃입니다.

### 일반 Callout 3단 중첩 (Obsidian 공식 예시와 동일 구성)

> [#QUESTION] Can callouts be nested?
> > [#TODO] Yes!, they can.
> > > [#EXAMPLE] You can even use multiple layers of nesting.

### Custom 스타일 2단 중첩

> [!QUESTION] 중첩이 되나요?
> 네, 될 수도 있습니다.
> > [!TODO] 안쪽 콜아웃
> > 이건 바깥 QUESTION 콜아웃 안에 중첩된 TODO 콜아웃입니다.

### Custom 스타일 3단 중첩

> [!QUESTION] Can callouts be nested?
> > [!TODO] Yes!, they can.
> > > [!EXAMPLE] You can even use multiple layers of nesting.

### 교차 중첩 — 일반 안에 Custom

> [#NOTE] 바깥은 일반 콜아웃
> 바깥 타입: 일반(`[#TYPE]`)
> > [!TIP] 안쪽은 Custom 콜아웃
> > 안쪽 타입: Custom(`[!TYPE]`)

### 교차 중첩 — Custom 안에 일반

> [!NOTE] 바깥은 Custom 콜아웃
> 바깥 타입: Custom(`[!TYPE]`)
> > [#TIP] 안쪽은 일반 콜아웃
> > 안쪽 타입: 일반(`[#TYPE]`)
