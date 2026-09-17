---
slug: wikilink-test-hub
title: Wikilink Resolution Test Hub
date: 2026-09-18
tags:
  - test
description: 파일명/경로 기반 wikilink resolution 동작 확인용 테스트 문서
show_on_homepage: false
---

## 파일명 기반 매칭 (bare, 유일할 때)

- 케이스 1 — bare, 확장자 없음: [[Unique]]
- 케이스 2 — bare, `.md` 확장자 포함: [[Unique.md]]

두 케이스 모두 `/article/wikilink-test-unique` 링크가 되어야 합니다(파일명이 vault 전체에서 유일하므로).

## 경로 기반 매칭

- 케이스 3 — 경로, 확장자 없음: [[_wikilink-test/Unique]]
- 케이스 4 — 경로, `.md` 확장자 포함: [[_wikilink-test/Unique.md]]

두 케이스 모두 케이스 1·2와 동일한 문서로 링크되어야 합니다.

## title 기반 매칭 제거 확인

- 케이스 5 — 파일명이 아니라 frontmatter title로 참조: [[Unique Target Doc]]

Unique.md의 title은 "Unique Target Doc"이지만, 이제 title은 매칭에 안 쓰이므로 링크가 되면 안
되고 **평문 텍스트 그대로** 보여야 합니다.

## 파일명 충돌 — bare 형태는 비활성화되어야 함

- 케이스 6 — bare, 모호함(같은 이름이 두 곳에 있음): [[Collide]]

`_wikilink-test/Collide.md`와 `_wikilink-test/nested/Collide.md` 둘 다 파일명이 "Collide"라
bare 키가 등록되지 않아야 하므로, 이 케이스는 **평문 텍스트 그대로** 보여야 합니다.

## 파일명 충돌 — 경로로 명시하면 각각 정상 매칭

- 케이스 7 — 최상위: [[_wikilink-test/Collide]]
- 케이스 8 — nested: [[_wikilink-test/nested/Collide]]

케이스 7은 `/article/wikilink-collide-top`, 케이스 8은 `/article/wikilink-collide-nested`로
서로 다른 문서에 링크되어야 합니다.

## 별칭(alias) 문법

- 케이스 9 — 별칭 텍스트: [[Unique|여기를 클릭하면 Unique 문서로]]

링크 URL은 케이스 1과 동일하고, 화면에 보이는 텍스트만 "여기를 클릭하면 Unique 문서로"여야 합니다.

## 이미지 embed (회귀 확인 — 이 기능은 이번 변경과 무관)

![[test-photo.jpg]]

이번 변경은 wikilink 텍스트 링크 해석 로직만 건드렸으므로, 이미지 embed는 기존과 동일하게 정상
표시되어야 합니다.
