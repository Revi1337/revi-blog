---
title: Antigravity Tools
date: 2026-09-22 04:27
updated_at: 2026-09-22 05:19
tags:
  - antigravity
  - google
  - ai
  - tools
description: Google Antigravity 플랫폼에서 제공하는 표준 내장 도구 세트의 분류별 기능 명세와 세부 파라미터 및 훅 연계 활용 가이드
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-09-22/Antigravity-Tools-thumbnail.png
---

## 개요

Google Antigravity의 에이전트는 독립된 추론 능력뿐만 아니라, 사용자의 로컬 개발 환경 및 외부 웹 리소스와 능동적으로 상호작용하기 위한 표준 내장 도구(Built-in Tools)를 탑재하고 있습니다.

에이전트는 LLM의 Function Calling 메커니즘을 통해 이러한 도구들을 호출하며, 파일시스템 입출력, 쉘 명령 실행, 웹 검색 및 URL 분석, 멀티 에이전트 위임, 사용자 인터랙션 등을 체계적으로 수행합니다. 또한 이 도구들은 [[Antigravity Hooks]]에서 다루는 수명 주기 훅(PreToolUse 및 PostToolUse)의 핵심 타깃 Matcher로 지정되어 세밀한 실행 권한 제어와 보안 가드레일의 기준이 됩니다.

## Tools 사용 용도

에이전트가 도구를 활용하는 핵심 목적은 다음과 같습니다.

- **정밀한 코드베이스 제어**: 전체 파일을 무분별하게 덮어쓰지 않고, 슬라이스 조회(view_file) 및 블록 단위 수정(replace_file_content)을 통해 컨텍스트 토큰을 절약하며 안전하게 코드를 수정합니다.
- **시스템 명령 실행 및 비동기 작업 관리**: 빌드, 테스트, 린트 등의 쉘 명령을 실행하고, 장시간 소요되는 작업은 백그라운드 태스크로 전환하여 지속적으로 상태를 관리합니다.
- **외부 정보 및 최신 지식 리서치**: 최신 기술 문서나 에러 해결을 위해 웹 검색을 수행하고 공식 문서 URL의 내용을 마크다운 형태로 직접 추출해 작업 컨텍스트로 활용합니다.
- **멀티 에이전트 협업 및 작업 분할**: 복잡한 조사나 독립적인 서브태스크를 서브에이전트에게 병렬 위임하여 메인 컨텍스트 오염을 방지하고 작업 효율을 극대화합니다.
- **사용자 인터랙션 및 거버넌스 준수**: 모호한 요구사항에 대해 대화형 객관식 질문을 통해 사용자 피드백을 수집하며, 제한된 자원 접근 시 명시적으로 권한을 요청합니다.

## Tools 종류

공식 문서 기준, Antigravity 표준 도구는 역할과 도메인에 따라 5개 범주로 분류됩니다.

- 파일 및 디렉터리 작업 (File and Directory Operations)
- 검색 및 리서치 (Search and Research)
- 시스템 및 명령 실행 (System and Execution)
- 에이전트 협업 (Agent Collaboration)
- 상호작용 및 미디어 (Interaction and Media)

### 파일 및 디렉터리 작업

로컬 프로젝트의 디렉터리 구조를 탐색하고 소스코드 및 설정 파일을 안전하게 읽고 쓰는 도구군입니다.

| 도구명 | 설명 | 주요 인자 (Arguments) |
| :--- | :--- | :--- |
| **view_file** | 텍스트 파일(특정 라인 범위 슬라이스 포함) 및 바이너리 파일(이미지, PDF 등)의 내용을 확인합니다. | AbsolutePath (필수), StartLine (선택), EndLine (선택), ContentOffset (선택), IsSkillFile (선택) |
| **write_to_file** | 새 파일을 생성하거나 기존 파일 내용을 전체 덮어씁니다. 아티팩트 문서 작성 시에도 사용됩니다. | TargetFile (필수), Overwrite (필수), CodeContent (필수), Description (필수), ArtifactMetadata (선택) |
| **replace_file_content** | 기존 파일 내에서 단일 연속 텍스트 블록을 정확히 찾아 새로운 내용으로 교체합니다. | TargetFile (필수), Instruction (필수), Description (필수), TargetContent (필수), ReplacementContent (필수), StartLine (필수), EndLine (필수), AllowMultiple (필수) |
| **multi_replace_file_content** | 단일 파일 내 여러 비연속 블록을 한 번의 호출로 원자적으로 일괄 교체합니다. | TargetFile (필수), Instruction (필수), Description (필수), ReplacementChunks (필수) |
| **list_dir** | 특정 디렉터리 바로 아래의 파일 및 하위 폴더 목록을 조회합니다. | DirectoryPath (필수) |
| **find_by_name** | Glob 패턴을 기반으로 파일 및 디렉터리 경로를 고속 탐색합니다. | SearchDirectory (필수), Pattern (필수), Type (선택), Excludes (선택), Extensions (선택), MaxDepth (선택) |

- **파일 수정 시 권장사항**:
	- 사소한 코드 변경에는 write_to_file로 전체를 덮어쓰기보다는 view_file로 라인을 확인한 후 replace_file_content를 사용하는 것이 토큰 절약과 충돌 방지에 유리합니다.
- **ContentOffset 참고**:
	- view_file의 ContentOffset은 공식 웹 문서 요약본에는 빠져있지만, 실제로 존재하는 필드입니다.

### 검색 및 리서치

로컬 코드베이스 패턴 검색 및 외부 인터넷 리소스 탐색을 담당하는 도구군입니다.

| 도구명 | 설명 | 주요 인자 (Arguments) |
| :--- | :--- | :--- |
| **grep_search** | 지정한 파일 경로 또는 디렉터리 내부에서 키워드나 정규식 패턴을 고속 매칭합니다. | SearchPath (필수), Query (필수), IsRegex (선택), CaseInsensitive (선택), Includes (선택), MatchPerLine (선택) |
| **search_web** | 구글 웹 검색을 통해 최신 기술 정보, 공식 문서, 라이브러리 변경사항 등을 검색합니다. | query (필수), domain (선택) |
| **read_url_content** | 공개된 웹 URL에 직접 요청을 보내 본문 콘텐츠를 마크다운 텍스트 형태로 변환하여 추출합니다. | Url (필수) |

### 시스템 및 명령 실행

운영체제 쉘 환경과 직접 상호작용하고 작업 수명 주기 및 권한 체계를 제어하는 도구군입니다.

| 도구명 | 설명 | 주요 인자 (Arguments) |
| :--- | :--- | :--- |
| **run_command** | Zsh 또는 Bash 쉘 명령어를 실행합니다. 설정된 대기 시간을 초과하면 자동으로 백그라운드 태스크로 전환됩니다. | CommandLine (필수), Cwd (필수), WaitMsBeforeAsync (필수), RunPersistent (선택), RequestedTerminalID (선택) |
| **manage_task** | 백그라운드로 전환된 비동기 작업의 목록을 조회하거나 중단, 표준 입력 전달 등의 제어를 수행합니다. | Action (필수: list, kill, status, send_input), TaskId (선택), Input (선택) |
| **schedule** | 일회성 알림 타이머를 등록하거나 주기적으로 실행되는 크론 스케줄을 설정합니다. | Prompt (필수), DurationSeconds (선택), CronExpression (선택), TimerCondition (선택), MaxIterations (선택) |
| **list_permissions** | 현재 세션에 인가된 파일 접근 및 명령어 실행 권한 목록을 확인합니다. | 인자 없음 |
| **ask_permission** | 제한된 외부 경로 접근이나 민감한 작업 수행을 위해 사용자에게 명시적으로 권한을 요청합니다. | Action (필수), Target (필수), Reason (필수) |

### 에이전트 협업

거대한 복합 과업을 여러 전문 에이전트로 분할하여 병렬 처리할 수 있도록 지원하는 오케스트레이션 도구군입니다.

| 도구명 | 설명 | 주요 인자 (Arguments) |
| :--- | :--- | :--- |
| **invoke_subagent** | 사전에 정의된 역할의 서브에이전트를 백그라운드에 병렬로 호출합니다. | Subagents (필수: Prompt, Role, TypeName, Workspace, Model) |
| **define_subagent** | 현재 대화 세션 동안 특화된 용도로 활용할 새로운 서브에이전트 유형을 동적으로 정의합니다. | name (필수), description (필수), system_prompt (필수), enable_write_tools (선택), enable_mcp_tools (선택), enable_subagent_tools (선택) |
| **send_message** | 백그라운드에서 실행 중인 다른 서브에이전트에게 추가 지침을 전달하거나 상태를 질의합니다. | Recipient (필수: conversationId), Message (필수) |
| **manage_subagents** | 현재 세션에서 파생된 활성 서브에이전트 목록을 확인하거나 작업을 강제 종료합니다. | Action (필수: list, kill, kill_all), ConversationIds (선택) |

### 상호작용 및 미디어

사용자와의 대화형 피드백 수집 및 미디어 생성을 위한 도구군입니다.

| 도구명 | 설명 | 주요 인자 (Arguments) |
| :--- | :--- | :--- |
| **ask_question** | 모호한 요구사항이나 다중 선택지를 대화형 모달 창으로 사용자에게 제시하고 응답을 대기합니다. | questions (필수: question, options, is_multi_select) |
| **generate_image** | 텍스트 프롬프트를 기반으로 이미지를 생성하거나 기존 이미지를 편집하여 아티팩트에 저장합니다. | Prompt (필수), ImageName (필수), AspectRatio (선택), ImagePaths (선택) |

## Hook 연계 및 Matcher 활용

Antigravity의 훅 시스템([[Antigravity Hooks]])에서는 상기 정의된 도구 이름을 대상으로 실행 가드레일과 필터를 적용합니다.

- **툴 매처 매칭 문법**:
	- **따옴표 빈 문자열("") 또는 별표("*")**: 모든 도구 호출을 감시합니다.
	- **"run_command"**: 특정 단일 도구만 정확히 매칭합니다.
	- **"run_command|write_to_file"**: 둘 중 하나의 도구가 호출될 때 매칭합니다.
	- **"browser_.*"**: 정규식 접두사 패턴에 해당하는 도구들을 일괄 매칭합니다.
- **PreToolUse를 통한 실행 거버넌스 제어**:
	- **allow**: 도구 실행을 즉시 허용합니다.
	- **deny**: 보안 정책 위반 시 도구 실행을 즉시 차단합니다.
	- **ask**: 사용자에게 확인 팝업을 띄우되 이전 허용 캐시를 인정합니다.
	- **force_ask**: 캐시된 권한을 무시하고 사용자 승인을 강제합니다.
	- **deny_unless_prior_grant**: 사전 명시적 승인 내역이 없는 리소스 접근 시 즉시 차단합니다.

## CLI UI 및 도구 그룹 매핑

Google Antigravity CLI(agy) 내부에서는 개별 저수준 도구들을 TUI 상에서 사용자 친화적으로 묶어 표시하거나 권한 정책을 부여하기 위해 상위 그룹화 체계를 사용합니다.

> [!info] 근거
> 공개 문서가 아니라, 로컬에 설치된 Antigravity CLI 바이너리(`agy`)의 `strings` 정적 분석 및 Go 내부 심볼(`gopclntab`) 분석으로 확인했습니다. 바이너리 내부에 TUI 렌더링 심볼, 상태 문자열 및 Protobuf 액션 정의가 그대로 임베드되어 있습니다.
>
> ```bash
> strings /Users/revi1337/.local/bin/agy | grep -E "render\.(ToolDisplayName|toolStepInfo|CollapsedToolGroup)"
> strings /Users/revi1337/.local/bin/agy | grep -E "Reading %q|Editing files|Searching web"
> strings /Users/revi1337/.local/bin/agy | grep -E "antigravity\.localharness\.Action"
> ```
>
> 검증된 원문 및 심볼 발췌:
> ```text
> // 1. TUI 렌더러 심볼 (third_party/jetski/cli/render/step_render.go)
> google3/third_party/jetski/cli/render/render.ToolDisplayName
> google3/third_party/jetski/cli/render/render.toolStepInfo
> google3/third_party/jetski/cli/render/render.CollapsedToolGroup
> 
> // 2. TUI 라이브 상태 문자열 리터럴 (rodata)
> Reading %qViewing %sListing %sEditing %sRunning %sCalling %s
> Finding files / Searching web / Editing files / Using browser / Delegating
> 
> // 3. 로컬 하네스 액션 추상화 (antigravity.localharness)
> ActionViewFile        -> view_file
> ActionEditFile        -> replace_file_content / multi_replace_file_content
> ActionCreateFile      -> write_to_file
> ActionRunCommand      -> run_command
> ActionSearchDirectory -> grep_search
> ActionFindFile        -> find_by_name
> ActionSearchWeb       -> search_web
> ActionReadUrlContent  -> read_url_content
> ```
>
> 위 분석을 통해 표준 내장 도구들이 TUI 표시 단위(`Read`, `Edit`, `Search`, `WebSearch`, `Command`), 내부 하네스 실행 단위(`Action...`), 그리고 외부 호환 단위(`Claude Code permissions`)로 구조화되어 그룹 관리됨을 확인했습니다(2026-09-22 기준, `agy` 바이너리).

### TUI 렌더링 및 상태 표시 계층

터미널 화면(TUI)에서 에이전트가 도구를 호출할 때, `step_render.go`의 렌더러가 원시 도구명을 직관적인 사용자 친화적 그룹 레이블로 변환하여 출력합니다.

- **Edit (Editing files)**:
	- 매핑 도구: `replace_file_content`, `multi_replace_file_content`, `write_to_file`
	- UI 표시: `Editing files`, `Editing %s`, 수정 내역 diff 블록(`Diff for %s:`)
- **Read (Reading file)**:
	- 매핑 도구: `view_file`, `list_dir`
	- UI 표시: `Reading file`, `Reading %q`, `Viewing %s`
- **Search (Finding files)**:
	- 매핑 도구: `find_by_name`, `grep_search`
	- UI 표시: `Finding files`, `*Searched filesystem*`, `Listing %s`
- **WebSearch (Searching web)**:
	- 매핑 도구: `search_web`, `read_url_content`
	- UI 표시: `Searching web`, `*Searched web for %s*`, `Reading page...`
- **Command (Running command)**:
	- 매핑 도구: `run_command`
	- UI 표시: `Running command`, `Running %s`
- **Subagents (Delegating)**:
	- 매핑 도구: `invoke_subagent`, `define_subagent`
	- UI 표시: `Delegating`, `Subagents`
- **CollapsedToolGroup 동작**:
	- 에이전트가 탐색 과정에서 `view_file`, `list_dir`, `grep_search` 등을 연속으로 실행하면, TUI에서는 이를 개별 노출하지 않고 `Read (3 files)` 또는 `Search` 형태로 묶어서(Collapse) 깔끔하게 접어 표시합니다.

### 내부 하네스 액션 추상화 계층

바이너리 내 `antigravity.localharness` 패키지(Protobuf 메시지 정의)에서는 세부 도구들이 다음과 같은 상위 Action 타입으로 정규화됩니다.

- **write_to_file**: `ActionCreateFile`
- **replace_file_content**: `ActionEditFile` (`ActionEdit`)
- **view_file**: `ActionViewFile` (`ActionView`)
- **run_command**: `ActionRunCommand`
- **grep_search 및 find_by_name**: `ActionSearchDirectory`, `ActionFindFile`
- **search_web**: `ActionSearchWeb`
- **read_url_content**: `ActionReadUrlContent`

### 퍼미션 및 호환 계층

Claude Code 호환 설정(`.claude/settings.json`)이나 에이전트 권한 정책에서 상위 그룹 단위로 권한을 부여할 때 다음과 같이 Antigravity 네이티브 도구와 1:1 대응됩니다.

| UI / 퍼미션 그룹명       | 실제 호출되는 Antigravity 표준 내장 도구                                          |
| :----------------- | :-------------------------------------------------------------------- |
| **Edit**           | `replace_file_content`, `multi_replace_file_content`, `write_to_file` |
| **Read**           | `view_file`, `list_dir`                                               |
| **WebSearch**      | `search_web`                                                          |
| **WebFetch**       | `read_url_content`                                                    |
| **Bash / Command** | `run_command`                                                         |

## Reference

- [Hooks | Google Antigravity Docs](https://antigravity.google/docs/hooks/#search-and-research)
