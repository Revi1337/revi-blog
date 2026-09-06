# revi-blog

Next.js 기반 개인 기술 블로그. 마크다운 콘텐츠 파이프라인, 다이어그램 렌더링, 검색, 방문자 통계 등을 자체 구현으로 갖추고 있습니다.

## 개요

- IT 기술의 동작 원리 등을 다루는 개인 기술 블로그
- 콘텐츠는 저장소 안의 마크다운 파일(`content/articles/`)로 관리하며, 별도의 CMS나 DB 없이 빌드 시점에 파싱합니다
- [spec-kit](https://github.com/github/spec-kit) 기반 Spec-Driven Development로 기능을 개발합니다 (`specs/`, `.specify/`)

## 주요 기능

- 커스텀 마크다운 렌더링 파이프라인 (콜아웃, 수식, 다이어그램, 코드 하이라이팅)
- FlexSearch 기반 클라이언트 검색 (Cmd+K 커맨드 팔레트)
- Giscus 연동 댓글
- 이미지 라이트박스 (PhotoSwipe)
- 게시글 오디오 내레이션 재생
- Upstash Redis 기반 방문자/조회수 통계
- 다크/라이트 테마 토글
- 북마크 페이지, RSS 피드, 사이트맵

## 기술 스택

- **프레임워크**: Next.js 16 (App Router), React 19, TypeScript
- **스타일**: Tailwind CSS 4
- **마크다운 파이프라인**: unified / remark / rehype, gray-matter, shiki, rehype-pretty-code, rehype-katex
- **검색**: FlexSearch, cmdk
- **다이어그램**: Mermaid, PlantUML(plantuml-encoder), Markmap
- **댓글**: Giscus
- **이미지**: PhotoSwipe, probe-image-size
- **데이터/통계**: Upstash Redis (`@upstash/redis`)
- **애니메이션**: Motion

## 프로젝트 구조

```
app/                Next.js App Router (페이지, API 라우트)
components/         UI 컴포넌트 (article, home, layout, search, stats, theme ...)
lib/                콘텐츠 파싱, 통계, 다이어그램, 훅 등 비 UI 로직
content/            블로그 원본 콘텐츠 (markdown, yaml)
core/               디자인 레퍼런스 정적 HTML 목업
public/             폰트, 이미지, 첨부파일
specs/              spec-kit 기능 명세 (spec.md / plan.md / tasks.md)
.specify/           spec-kit 워크플로우 및 프로젝트 헌법(constitution)
```

## 시작하기

### 사전 준비

- Node.js, npm
- (선택) 방문자 통계를 실제로 동작시켜 보려면 Docker Desktop

### 설치

```bash
npm install
```

### 환경 변수

`.env.example`을 참고해 `.env.local`을 작성합니다.

| 변수 | 설명 |
| --- | --- |
| `SITE_URL` | 배포된 사이트의 절대 URL (sitemap, RSS 등에 사용) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` / `KV_REST_API_READ_ONLY_TOKEN` | Upstash Redis REST API 접속 정보 (Vercel Marketplace 연동 시 자동 생성) |
| `KV_URL` / `REDIS_URL` | Upstash Redis 연결 문자열 |
| `CRON_SECRET` | 방문자 통계 정리 Cron(`/api/cron/cleanup-stats`) 인증용 시크릿 |

로컬 `.env.local`에는 Upstash 값을 넣지 않는 것이 원칙입니다 — 넣으면 `next dev`가 프로덕션과 같은 Redis 인스턴스를 그대로 공유하게 됩니다. 값이 없으면 인메모리 mock으로 자동 폴백됩니다. 자세한 내용은 [방문자 통계용 로컬 Redis](#방문자-통계용-로컬-redis) 참고.

### 개발 서버 실행

```bash
npm run dev
```

기본적으로 `http://localhost:3999`에서 실행됩니다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 (인메모리 통계 mock 사용) |
| `npm run dev:docker` | 로컬 Docker Redis를 띄우고 개발 서버 실행 (통계 위젯 실제 동작 확인용) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드된 앱 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run redis:up` / `redis:down` | 로컬 Docker Redis 컨테이너 시작/종료 |

## 콘텐츠 작성

게시글은 `content/articles/` 아래에 카테고리별 디렉터리로 마크다운 파일을 추가해 작성합니다. 프론트매터로 다음 필드를 지원합니다.

```yaml
---
title: 문서 제목
date: 2026-01-01
updated_at: 2026-01-02
tags: [tag1, tag2]
description: 목록/SEO에 노출될 요약
thumbnail: https://.../thumbnail.jpg
audio:
  - https://.../narration.mp3
---
```

> [!IMPORTANT]
> `content/articles/**`를 수정한 뒤에는 브라우저 새로고침만으로는 반영되지 않습니다. 콘텐츠는 모듈 최상단 `await`로 한 번만 로드되어 캐시되므로, 반드시 `next dev`를 재시작해야 변경 사항이 보입니다.

## 지원하는 마크다운 확장 문법

### 콜아웃 (기본 / 커스텀)

Obsidian 스타일 콜아웃 문법을 지원합니다. `[#TYPE]`은 기본(GitHub Alert류) 스타일, `[!TYPE]`은 사이트 전용 커스텀 스타일로 렌더링됩니다.

```markdown
> [!NOTE]
> 기본 콜아웃 내용

> [!WARNING]- 접힌 상태로 시작하는 콜아웃
> `-`를 붙이면 collapsed, `+`를 붙이면 expanded 상태로 시작합니다.
```

지원 타입: `note`, `tip`, `warning`, `danger`, `info`, `success`, `question`, `bug`, `example`, `quote`, `important`, `abstract`, `todo`, `failure`, `collapse` 및 `caution`/`hint`/`check` 등 다수의 별칭.

### 수식 (KaTeX)

`remark-math` + `rehype-katex`로 인라인(`$...$`)/블록(`$$...$$`) 수식을 렌더링합니다.

### Mermaid 다이어그램

````markdown
```mermaid
flowchart TD
    A[시작] --> B{조건 확인}
```
````

### PlantUML 다이어그램

````markdown
```plantuml
@startuml
Alice -> Bob: 요청
@enduml
```
````

### Markmap 마인드맵

마크다운 헤딩 구조를 그대로 마인드맵으로 렌더링합니다.

````markdown
```markmap
# 루트
## 가지 1
## 가지 2
```
````

## 방문자 통계용 로컬 Redis

`@upstash/redis`는 REST API만 지원하므로, 로컬에서 실제 Redis처럼 동작을 확인하려면 `docker-compose.yml`로 `redis` + REST 프록시(`serverless-redis-http`)를 함께 띄웁니다.

```bash
npm run dev:docker
```

일반 `npm run dev`는 인메모리 mock을 사용하며, Node 런타임(`/api/track`)과 Edge 런타임(`/api/stats`)이 서로 다른 프로세스 격리 때문에 메모리를 공유하지 못해 위젯 숫자가 항상 0으로 보입니다. 실제로 증가하는 모습을 보려면 반드시 `dev:docker`를 사용해야 합니다.

## 개발 방법론

이 프로젝트는 [spec-kit](https://github.com/github/spec-kit) 기반 Spec-Driven Development(SDD) 방식으로 개발합니다.

- `specs/<feature>/spec.md`, `plan.md`, `tasks.md` — 기능별 명세, 구현 계획, 작업 목록
- `.specify/memory/constitution.md` — 프로젝트의 원칙과 게이트(non-negotiable)

새 기능을 추가하기 전에는 해당 기능이 이미 `specs/`에 문서화되어 있는지 먼저 확인하는 것을 권장합니다.

## 테스트

별도의 자동화 테스트 프레임워크(Jest/Vitest 등)는 구성되어 있지 않습니다. 대신 다음 방식으로 검증합니다.

1. `npm run build`로 빌드 오류/타입 오류 확인
2. 브라우저에서 실제 기능 동작 확인 (수동 또는 Playwright 기반 도구 활용)

## 배포

[Vercel](https://vercel.com)에 배포하는 것을 기준으로 구성되어 있습니다 (`vercel.json`).

- 리전: `icn1` (서울)
- Cron: 매주 방문자 통계 정리 작업(`/api/cron/cleanup-stats`) 실행

## 라이선스

오픈소스 라이선스가 아닙니다. 모든 권리는 저작권자에게 있습니다. 자세한 내용은 [LICENSE](./LICENSE) 참고.
