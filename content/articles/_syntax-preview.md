---
title: "Syntax Preview (내부 검증용)"
category: "TEST"
date: "2026-07-20"
tags: ["test"]
show_on_homepage: false
thumbnail: "/images/lightbox-test/photo-1.jpg"
---

## 콜아웃 (GitHub Alert 스타일)

> [#NOTE]
> 기본 노트 콜아웃

> [#WARNING]- 접힌 경고
> 클릭하면 펼쳐진다

> [#IMPORTANT]
> GitHub Alert 별칭이 옵시디언 콜아웃과 동일하게 렌더링되는지 확인

## 콜아웃 (Comeau 스타일 프로토타입)

> [!SUCCESS] Carved tooltips
> joshwcomeau.com의 콜아웃을 벤치마킹한 프로토타입. 좌측에 SVG 곡선 장식이 흐르다가
> 아이콘 뱃지와 겹치는 지점에서 끝나고, 그 아래는 단색 바로 이어진다.

> [!INFO] 정보
> 컨테이너 쿼리로 폭이 좁아지면 장식을 접고 단순 border-left로 바뀐다.

> [!WARNING] 경고
> 경고 타입 색상 확인용.

> [!WARNING]- 접힌 경고
> 접힌 경고 타입 색상 확인용.

> [!TIP]+ 펼친 채 시작하는 팁
> 접기 마커가 `+`면 details에 open 속성이 붙어 처음부터 펼쳐진 채로 렌더된다.

> [!DANGER] 위험
> 위험 타입 색상 확인용.

> [!QUOTE] 인용
> 인용 타입 색상 확인용.

## 수식

인라인 $O(n \log n)$ 그리고 블록:

$$
\sum_{i=1}^{n} x_i
$$

깨진 수식도 페이지를 죽이지 않아야 한다: $\frac{1}{$

## 하이라이트와 주석

이 문장은 ==반드시 강조==되어야 하고, `==코드 안은 그대로==`여야 한다.

공개 문장. %%이 메모는 절대 보이면 안 됨%% 다음 공개 문장.

## 이미지 (라이트박스 검증용)

![산 풍경](/images/lightbox-test/photo-1.jpg)

![바닷가](/images/lightbox-test/photo-2.jpg)

![숲길](/images/lightbox-test/photo-3.jpg)

## 옵시디언 wikilink / embed 검증

임베드(별칭 없음): ![[test-photo.jpg]]

임베드(별칭 있음): ![[test-photo.jpg|커스텀 alt 텍스트]]

임베드(이미지가 아닌 파일 — img로 오인하지 않고 평문으로 남아야 함): ![[report.pdf]]

wikilink(slug로 매칭): [[gc-tuning-jvm-applications]]

wikilink(제목으로 매칭, 별칭 있음): [[Spring Transcation Interview|스프링 트랜잭션 글]]

wikilink(존재하지 않는 노트 — 평문으로 남아야 함): [[존재하지-않는-노트]]

#### h4 레벨 소제목 (TOC에는 안 나타나야 함)

<details>
<summary>접기/펼치기</summary>

디자인 톤이 콜아웃 접기와 통일되어야 한다.

</details>

같은 걸 Comeau 콜아웃의 무타입(collapse) 버전으로 구현하면:

> [!COLLAPSE]- 접기/펼치기
> unfold-vertical 아이콘 + 중립 회색(--color-outline-variant) 조합. 특정 타입 강조색이 없는 순수 접기 섹션용.
