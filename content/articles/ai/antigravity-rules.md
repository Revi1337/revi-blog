---
title: Antigravity Rules
date: 2026-09-22 05:58
updated_at: 2026-09-23 09:20
tags:
  - ai
  - google
  - antigravity
  - rules
description: Google Antigravity 에이전트의 룰(Rules) 시스템 개요, 저장 위치 및 계층적 탐색 메커니즘, Frontmatter 스펙과 4가지 트리거 모드(Glob, Always On, Model Decision, Manual), 컨텍스트 예산 최적화 기법을 구조적으로 정리한 문서
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-09-23/Antigravity-Rules-thumbnail.png
---

## 개요

Google Antigravity 플랫폼에서 룰(Rules)은 에이전트가 코드베이스를 탐색하고, 파일을 수정하며, 명령을 실행할 때 반드시 준수해야 하는 가이드라인, 제약 조건, 코딩 표준을 정의하는 핵심 제어 메커니즘입니다.

무분별하게 모든 규칙을 시스템 프롬프트에 상시 주입할 경우 발생할 수 있는 컨텍스트 비대화(Context Bloat)와 프롬프트 희석을 방지하기 위해, 안티그래비티는 YAML Frontmatter 기반의 세분화된 활성화 제어와 계층적 상향 탐색 메커니즘을 제공합니다.

## Rule 파일의 역할

에이전트의 높은 자율성으로 인해 발생할 수 있는 의도치 않은 코드 변경을 방지하고 작업 품질을 일관되게 유지하기 위해 다음과 같은 역할을 수행합니다.

- **코딩 컨벤션 강제**: 언어별 린트 규칙, 포매팅 스타일 가이드, 네이밍 규칙, 파일 및 디렉터리 구조 표준화
- **안전 및 보안 가이드라인 수립**: 프로덕션 DB 직접 수정 금지, 특정 위험 명령어 실행 방지, 민감 정보 노출 제한
- **아키텍처 및 라이브러리 가이드**: 프로젝트에서 권장하거나 금지하는 라이브러리, 모듈 간 의존성 규칙, 디자인 패턴 명시
- **검증 루프 표준화**: 코드 수정 완료 후 실행해야 하는 빌드 명령어, 테스트 스위트 실행 절차 명시

## Rule 저장 위치 및 탐색 메커니즘

규칙 파일은 선언 목적과 적용 범위에 따라 세 가지 위치에 작성할 수 있습니다.

- **디렉터리 기반 규칙 (Directory-based Rules)**
  - 파일명: `GEMINI.md`, `AGENTS.md`
  - 특징: Frontmatter를 지원하지 않으며, 해당 파일이 위치한 디렉터리 및 하위의 모든 디렉터리에 항상 활성화(Always Active)됩니다.
  - 상향 탐색(Walk-up): 에이전트가 현재 작업 디렉터리(CWD)에서 작업을 시작하면 리포지토리 루트(`.git`이 위치한 디렉터리)까지 상향 탐색하며 발견되는 모든 `GEMINI.md`와 `AGENTS.md`를 수집하여 결합합니다.
- **프로젝트 단위 전용 룰셋 (Project-level Rules)**
  - 위치: `.agents/rules/*.md` (또는 `.agent/rules/`, `_agents/rules/`, `_agent/rules/`)
  - 특징: 개별 마크다운 파일 상단에 YAML Frontmatter를 정의하여 특정 상황이나 특정 파일에만 조건부로 로드되도록 정교하게 제어할 수 있습니다.
  - 협업: VCS(Git 등)에 커밋하여 팀 전체가 일관된 규칙을 공유할 때 사용됩니다.
- **사용자 전역 설정 (Global Rules)**
  - 위치: `~/.gemini/config/`
  - 특징: 로컬 머신에서 실행되는 모든 안티그래비티 세션에 전역적으로 적용되는 개발자 개인 선호 및 공통 지침입니다.

### 로딩 우선순위 (Precedence)

여러 위치에서 동일하거나 상충되는 규칙이 발견될 경우 다음 우선순위에 따라 상위 규칙이 우선 적용됩니다.

1. **Workspace Project**: 현재 작업 디렉터리에서 리포지토리 루트까지 계층적으로 탐색된 프로젝트 규칙
2. **Declared Configurations**: 워크스페이스의 `skills.json` 또는 `plugins.json`에 명시적으로 등록된 규칙
3. **Global Discovery**: 사용자 홈 디렉터리의 전역 설정(`~/.gemini/config/`)
4. **Built-in Customizations**: 안티그래비티 플랫폼에 기본 탑재된 번들 커스터마이징
5. **Global Declared Configurations**: 전역 설정 파일에 명시적으로 선언된 외부 규칙

> [!info] 근거
> 공개 문서가 아니라, 로컬에 설치된 Antigravity CLI 바이너리(`agy`)의 `strings` 정적 분석으로 확인했습니다. 바이너리 내부에 아래 문구가 마크다운 헬프 텍스트 형태로 그대로 임베드되어 있습니다.
>
> ```bash
> strings /Users/revi1337/.local/bin/agy | grep -A10 "## Rule Locations"
> strings /Users/revi1337/.local/bin/agy | grep -B15 "## Loading Priority and Precedence"
> ```
>
> 검증된 원문 발췌:
> ```text
> ## Rule Locations
> *   Directory-Based Rules (GEMINI.md / AGENTS.md): Placed directly in
>     any directory. The system walks up from the current working directory to the
>     repository root and loads these files. They apply to the directory they
>     reside in and all its subdirectories.
>
> ## Rule Format
> Rules are written in Markdown. Standalone GEMINI.md / AGENTS.md files do not
> support frontmatter and are always active for their directory scope.
>
> 1. Team/Project Customizations:
>    *   Path: .agents/ (or .agent/, _agents/, _agent/) at the root of your project.
>    *   Use this to share customizations with your team by checking them into VCS.
>    *   The agent walks from your current working directory up to the repository
>        root (e.g., the folder containing .git) to find these directories.
> 2. Directory & Project Rules (Hierarchical):
>    *   Paths: GEMINI.md, AGENTS.md, .agents/rules/*.md
> 3. Global Configuration (Machine-Local):
>    *   Path: ~/.gemini/config/
>
> ## Loading Priority and Precedence
> 4. Workspace Project
> 5. Declared Configurations
> 6. Global Discovery
> 7. Built-in Customizations
> 8. Global Declared Configurations
> ```
>
> 위 원문과 노트 본문(저장 위치 3가지, 로딩 우선순위 5단계)이 일치함을 확인했습니다(2026-09-22 기준, `agy` 바이너리). 단, `.agents/rules/*.md`처럼 세부 경로에 `/rules/`를 붙이는 표기는 노트 저자가 다른 문맥과 합쳐 재구성한 것으로, 바이너리 원문은 `.agents/`까지만 명시합니다.

## Support Frontmatter

`.agents/rules/*.md` 경로에 작성하는 규칙 파일은 상단에 YAML Frontmatter를 선언하여 활성화 시점과 대상을 제어할 수 있습니다. Rule 파일을 읽고 쓰는 데 사용되는 내장 도구 목록과 UI 표기 매핑은 [[Antigravity Tools]] 참고.

안티그래비티 내부 엔진(Jetski Cortex)의 바이너리 및 데이터 구조에 정의된 공식 Frontmatter 규격은 다음과 같습니다.

```go
// google3/third_party/jetski/cortex/customizations/rules.go
type RuleFrontmatter struct {
    Trigger     string `yaml:"trigger"`
    Description string `yaml:"description"`
    Globs       string `yaml:"globs"`
    Glob        string `yaml:"glob"`
}
```

> [!info] 근거
> Google이 공개한 오픈소스나 공식 문서가 아니라, 로컬에 설치된 Antigravity CLI 바이너리(`agy`)를 `strings` 및 바이트 스캔으로 직접 정적 분석하여 확인한 내용입니다. Go 바이너리는 패닉 스택 트레이스와 리플렉션(YAML 역직렬화)을 위해 컴파일 시점의 소스 경로, 패키지 트리, 구조체명, 구조체 태그를 문자열 형태로 그대로 보존합니다.
>
> 검증 명령어:
> ```bash
> strings /Users/revi1337/.local/bin/agy | grep "third_party/jetski/cortex/customizations/rules.go"
> strings /Users/revi1337/.local/bin/agy | grep "RuleFrontmatter"
> strings /Users/revi1337/.local/bin/agy | grep "CortexMemoryTrigger"
> ```
> 위 경로, 구조체명, `yaml:"trigger"` 등 필드 태그, `CortexMemoryTrigger` Protobuf 열거형 심볼이 바이너리 내에 실제로 존재함을 확인했습니다(2026-09-22 기준, `agy` 바이너리).

내부 Protobuf 열거형(`CortexMemoryTrigger`)과 매핑되는 핵심 속성은 `trigger`, `description`, `glob`/`globs` 세 가지이며, 각각 아래에서 다룹니다.

## Trigger

규칙의 활성화 시점을 정의하는 **필수** 필드입니다. 직접 테스트 결과, `trigger` 자체를 작성하지 않으면 규칙이 동작하지 않습니다 — "생략 시 `always_on`으로 기본 처리된다"는 세간의 추정과 달리, 반드시 명시해야 합니다. 공식 문서(antigravity.google/docs)는 이 필드 자체를 문서화하지 않고 있습니다. 사용 가능한 값은 다음 4가지입니다.

### Always On

세션의 모든 상호작용(Prompt Interaction)마다 에이전트 시스템 프롬프트(`<user_rules>` 영역)에 지속적으로 인라인 주입(Continuously Active)되는 기본 모드입니다.

- **적용 대상**: `GEMINI.md`, `AGENTS.md`는 애초에 Frontmatter를 지원하지 않으며 해당 디렉터리 범위에서 항상 활성 상태로 처리됩니다. 반면 `.agents/rules/*.md`에서는 `trigger: always_on`을 직접 명시해야 하며, `trigger` 자체를 생략하면 규칙이 동작하지 않습니다(직접 테스트로 확인).
- **특징**: 에이전트가 어떤 파일을 탐색하거나 어떤 툴을 실행하든 항상 규칙이 시스템 프롬프트 상단에 유지됩니다.
- **권장 활용**: 프로젝트 전반에 예외 없이 강제해야 하는 핵심 코딩 철학, 최우선 보안 수칙, 기본 응답 언어 및 톤앤매너 설정.

```yaml
---
trigger: always_on
description: 프로젝트 공통 보안 수칙 및 언어 컨벤션
---

## 공통 보안 수칙
- 소스코드에 API 키, 토큰 등 민감한 자격 증명을 하드코딩하지 않습니다.
- 모든 파일 수정 후에는 반드시 프로젝트 린터를 실행하여 문법 오류가 없는지 검증합니다.
```

### Glob

에이전트가 작업 중 지정된 파일 패턴과 일치하는 파일을 열람, 생성, 수정할 때만 동적으로 활성화되는 트리거 방식입니다.

- **특징**: 관련 없는 작업 시에는 프롬프트를 차지하지 않으므로 컨텍스트 윈도우를 매우 효율적으로 보존할 수 있습니다.
- **패턴 지정**: 단일 패턴인 경우 `glob`, 다중 패턴인 경우 `globs` 배열을 사용하며, 재귀 매칭(`**/*`)을 지원합니다.
- **권장 활용**: 마크다운 서식 규칙, 특정 언어/프레임워크 코딩 컨벤션, 단위 테스트 작성 가이드, 특정 디렉터리 내 아키텍처 규칙.

```yaml
---
trigger: glob
description: 마크다운 문서 생성 및 수정 시 준수할 서식 규칙
globs:
  - "*.md"
  - "docs/**/*.md"
---

## Markdown 작성 규칙
- 문서에 이모지를 사용하지 않습니다.
- H1(#) 태그는 문서 제목에만 사용하며, 본문 소제목은 H2(##)부터 사용합니다.
- 본문 구분자인 수평선(---)은 사용하지 않습니다.
```

> [!warning] Glob의 맹점
> 실험 결과, 새로운 마크다운 파일을 생성하는 시점에는 아직 해당 파일이 존재하지 않기 때문에 glob 매칭 대상이 되지 않습니다. 즉 규칙이 적용되지 않은 상태로 파일이 먼저 생성되고, 생성 직후 이어지는 별도의 Edit에서야 비로소 glob이 매칭되어 규칙이 적용됩니다.
>
> 결과적으로 한 번의 요청이라도 실제로는 "① 파일 생성 Edit(규칙 미적용) → ② 생성된 파일을 규칙에 맞게 고치는 Edit(규칙 적용)" 두 번의 Edit으로 쪼개져 수행됩니다. 이미 존재하는 파일을 수정하는 경우에는 이런 현상 없이 첫 Edit부터 바로 규칙이 적용됩니다.

### Model Decision

점진적 공개(Progressive Disclosure) 원칙을 사용하는 지능형 트리거 방식입니다.

- **특징**: 세션 시작 시 규칙의 전체 본문을 시스템 프롬프트에 넣지 않고, 메타데이터인 `description` 요약 정보만 인덱스로 노출합니다. 모델이 사용자의 요청 내용과 현재 작업 맥락을 분석하여 해당 규칙이 필요하다고 판단하면, 온디맨드로 전체 본문을 불러와 적용합니다.
- **권장 활용**: 데이터베이스 마이그레이션 절차, 특정 라이브러리 사용 가이드, 대규모 리팩토링 체크리스트 등 일상적이지 않고 특정 목적이 명확한 작업 가이드.

```yaml
---
trigger: model_decision
description: Prisma ORM 스키마 변경 및 데이터베이스 마이그레이션 작업 시 준수할 안전 절차
---

## Database Migration 가이드
- 스키마 파일 수정 후 반드시 `prisma validate`를 실행하여 스키마 정합성을 검사합니다.
- 프로덕션 DB에 직접 `db push` 명령을 실행하지 말고, 항상 마이그레이션 히스토리 파일(`migrate dev`)을 생성합니다.
```

작성 팁: `description`에 에이전트가 작업을 인지할 수 있는 명확한 키워드와 상황(예: "Prisma ORM 스키마 변경", "DB 마이그레이션")을 명시해야 에이전트의 활성화 판단 정확도가 높아집니다.

### Manual

에이전트에게 자동으로 주입되지 않으며, **사용자가 에이전트 프롬프트에서 `@mention` 문법으로 명시적으로 호출(Explicitly activated via `@mention` in the agent prompt)할 때만 활성화되는 모드입니다.

- **동작 메커니즘**: 안티그래비티 CLI 엔진(`parseAtMentions`)이 사용자의 프롬프트 텍스트 내에서 `@규칙명` 또는 `@파일경로` 형태의 멘션을 감지하면, 해당 매뉴얼 규칙의 전체 본문을 시스템 컨텍스트에 즉시 로드합니다.
- **특징**: 일상적인 대화에서는 시스템 프롬프트에 전혀 포함되지 않으므로 토큰을 일체 소모하지 않으며, 특정 작업 수행 시 개발자가 명시적으로 가이드라인을 주입할 수 있습니다.
- **권장 활용**: 배포 직전 실행하는 릴리즈 체크리스트, 비정기적 보안 감사 프로토콜, 특정 장애 상황 전용 런북, 대규모 마이그레이션 점검.

```yaml
---
trigger: manual
description: 프로덕션 배포 전 최종 검증 체크리스트
---

## 배포 전 필수 검증
- 모든 엔드투엔드(E2E) 테스트 스위트가 통과했는지 확인합니다.
- 환경 변수 설정 파일의 필수 키 누락 여부를 검사합니다.
- 빌드 아티팩트 용량이 이전 릴리즈 대비 비정상적으로 증가하지 않았는지 확인합니다.
```

#### 프롬프트 호출 예시

터미널이나 대화창에서 프롬프트 작성 시 `@` 문자를 입력하면 지원되는 규칙 파일들이 자동 완성 목록에 표시되며, 다음과 같이 직접 호출하여 사용합니다.

```text
이번 릴리즈 배포 작업을 진행할 예정이야. @release-checklist 규칙을 참고해서 사전 검증을 먼저 수행해줘.
```

## Description

규칙의 목적과 적용되어야 하는 상황을 간결하게 설명하는 필드입니다. 특히 `trigger: model_decision` 사용 시 에이전트가 현재 맥락과 비교하여 규칙 로드 여부를 판단하는 핵심 기준이 됩니다.

## Glob & Globs

파일 매칭 패턴을 지정하는 필드입니다. 단일 패턴인 경우 `glob`, 다중 패턴인 경우 `globs` 배열을 사용하며, `trigger: glob`일 때 적용 대상 파일 패턴을 지정하는 데 사용됩니다.

## Rule 예산 및 제약 사항

안티그래비티는 에이전트의 추론 성능과 컨텍스트 안정성을 유지하기 위해 규칙 시스템에 명확한 크기 제한과 예산 정책을 적용합니다.

- **파일당 크기 제한 (Per-File Limit)**
  - 각 규칙 파일의 본문 용량은 최대 24,000 바이트(24 KB)로 제한됩니다.
  - 이 한도는 다른 파일을 가져오는 include 구문(`@[label](path)`)이 확장된 후의 최종 크기를 기준으로 계산되며, 24 KB를 초과하는 내용은 라인 단위로 자동 절삭(Truncated)됩니다.
- **누적 규칙 컨텍스트 예산 (Aggregate Rules Budget)**
  - 상시 활성화되는 Always-on 규칙과 글로벌 규칙들은 총 20,000 토큰(`defaultRulesBudget`)의 전용 예산을 공유합니다.
  - 이 예산은 Skills, Workflows, Subagents, MCP 도구 스키마에 할당된 커스터마이징 예산과 독립적으로 운영됩니다.
  - 등록된 규칙의 총합이 20,000 토큰을 초과할 경우, 초과된 규칙은 시스템 프롬프트 인라인 주입 대상에서 제외되고 파일 경로 포인터로 강등(Demote)되어 에이전트가 필요 시 온디맨드로 파일을 직접 읽도록 전환됩니다.
- **자동 중복 제거 (Deduplication)**
  - 동일한 규칙이 여러 경로(예: 상위 디렉터리 상향 탐색과 하위 디렉터리 상속)에서 중복 발견되더라도, 정규화된 절대 파일 경로를 기반으로 자동 중복 제거되어 한 턴에 한 번만 주입됩니다.
- **외부 파일 인클루드 지원 (`@[label](path)`)**
  - 규칙 파일 내에서 `@[공통 가이드](./common-guidelines.md)` 형태의 문법을 작성하면 해당 경로의 마크다운 내용을 인라인으로 확장 결합할 수 있습니다.

> [!info] 근거
> 공개 문서가 아니라, 로컬에 설치된 Antigravity CLI 바이너리(`agy`)의 `strings` 정적 분석으로 확인했습니다. 바이너리 내부에 아래 문구가 마크다운 헬프 텍스트 형태로 그대로 임베드되어 있습니다.
>
> ```bash
> strings /Users/revi1337/.local/bin/agy | grep -A10 "## Size Limits and Context Budget"
> strings /Users/revi1337/.local/bin/agy | grep -A20 "## Loading Priority and Precedence"
> ```
>
> 검증된 원문 발췌:
> ```text
> ## Size Limits and Context Budget
> *   **Per-File Limit (`24 KB` / `24,000` bytes)**: Each rule file is capped at
>     24,000 bytes (after expanding `@[label](path)` includes) and truncated on
>     line boundaries when over the cap.
> *   **Aggregate Rules Budget (`20,000` tokens)**: Always-on and global rules
>     share a dedicated 20,000-token rules budget (`defaultRulesBudget`),
>     separate from the customization budget for skills, workflows, subagents,
>     and MCP tools. Over-budget rules are demoted from full inline text to file
>     path pointers so the agent can read them on demand.
>
> ## Loading Priority and Precedence
> 1.  Workspace Project (Hierarchical discovery walking up from the CWD)
> 2.  Declared Configurations (skills.json / plugins.json)
> 3.  Global Discovery (~/.gemini/config/)
> 4.  Built-in Customizations
> 5.  Global Declared Configurations
> ```
>
> 위 원문과 노트 본문이 일치함을 확인했습니다(2026-09-22 기준, `agy` 바이너리).
>
> **공식 문서와의 수치 불일치**: 공식 웹 문서(antigravity.google/docs/rules-workflows)와 다수의 GitHub 이슈는 파일당 크기 제한을 "12,000 characters(문자)"로 명시하고 있어, 바이너리에서 확인된 "24,000 bytes(바이트)"와 수치가 다릅니다. 원인은 확인되지 않았으며, 공식 문서가 구버전 스펙을 반영했거나 제품 라인(2.0 / CLI / IDE)별로 실제 제한값이 다를 가능성이 있습니다. 본 노트는 로컬에 설치된 바이너리 기준(24,000 bytes)을 기록한 것이며, 공식 문서 수치와 병기해둡니다.

## Reference

- [Google Antigravity Documentation](https://antigravity.google/docs)
- [Google Antigravity Rules & Workflows Docs](https://antigravity.google/docs/rules-workflows)
