---
title: Antigravity Hooks
date: 2026-10-04 21:57
updated_at: 2026-10-04 22:44
tags:
  - ai
  - google
  - antigravity
  - hooks
description: "Google Antigravity의 훅(Hook) 명세 규격, 이벤트 라이프사이클 및 유저와 프로젝트 레벨 등록 방식을 정리한 가이드입니다."
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-10-04/Antigravity-Hooks-thumbnail.png
---

## 개요

> Antigravity CLI 1.2.16 기준으로 작성되었습니다.

훅(Hook)은 Antigravity의 핵심 제어 계층으로, 크게 두 가지 기술적 축을 기반으로 설계되었습니다.

- **이벤트 기반 실행 (Event-driven execution)**: 도구 호출 전후, 모델 추론 전후, 세션 종료 등 에이전트 실행 루프(Execution Loop)의 라이프사이클 이벤트를 실시간으로 감지하여 기계적으로 동작을 가로챕니다.
- **에이전트 수명 주기를 위한 커스텀 스크립트 (Custom Scripts for Agent Lifecycles)**: 자연어 프롬프트 지침에 의존하지 않고, 사용자가 정의한 셸 스크립트나 독립 실행 바이너리를 호스트 OS 환경에서 직접 구동하여 보안 가드레일 강제, 정적 분석(Linter), 진단 데이터 수집 및 동적 컨텍스트 주입을 수행합니다.

자연어 지침을 모델이 능동적으로 해석하여 실행 여부를 판단하는 스킬(Skill)이나 규칙(Rule)과 달리, 훅은 프로세스 표준 입출력(JSON IPC via stdin/stdout)을 통해 도구 실행을 즉시 하드 블록(Deny)하거나 세션 종료를 저지하는 등 결정론적인(Deterministic) 하드 제어 권한을 갖습니다. Antigravity 2.0, Antigravity CLI, Antigravity IDE 전반에서 동일한 규격으로 지원됩니다.

## Hook 명세 규격

훅은 `hooks.json` 설정 파일에 매핑 구조로 정의됩니다. 최상위 키는 훅의 고유 이름이며, 내부에 활성화 여부(`enabled`) 및 감지할 이벤트 배열을 정의합니다.

```json
{
	"safety-gate": {
		"enabled": true,
		"PreToolUse": [
			{
				"matcher": "run_command",
				"hooks": [
					{
						"type": "command",
						"command": "./scripts/safety-check.sh",
						"timeout": 30
					}
				]
			}
		]
	},
	"code-linter": {
		"PostToolUse": [
			{
				"matcher": "write_to_file|replace_file_content",
				"hooks": [
					{
						"type": "command",
						"command": "./scripts/lint.sh",
						"timeout": 15
					}
				]
			}
		]
	},
	"context-injector": {
		"PreInvocation": [
			{
				"hooks": [
					{
						"type": "command",
						"command": "./scripts/inject-context.sh"
					}
				]
			}
		]
	}
}
```

훅 정의 객체는 다음 필드를 지원합니다.

| 필드               | 타입      | 설명                                                                  |
| :--------------- | :------ | :------------------------------------------------------------------ |
| `enabled`        | boolean | 선택(Optional). 훅 정의를 삭제하지 않고 비활성화할 때 `false`로 설정합니다. 기본값은 `true`입니다. |
| `PreToolUse`     | array   | 도구 실행 직전에 호출되는 핸들러 목록입니다.                                           |
| `PostToolUse`    | array   | 도구 실행이 완료된 직후 호출되는 핸들러 목록입니다.                                       |
| `PreInvocation`  | array   | 모델이 호출되기 직전에 실행 루프에 개입하는 핸들러 목록입니다.                                 |
| `PostInvocation` | array   | 모델 호출 및 응답 처리가 완료된 직후 실행 루프에 개입하는 핸들러 목록입니다.                        |
| `Stop`           | array   | 에이전트 실행 루프가 종료될 때 호출되는 핸들러 목록입니다.                                   |

각 이벤트 배열 내부의 매처 및 핸들러 객체 필드는 다음과 같습니다.

| 필드                | 타입      | 설명                                                                                                                                                                 |
| :---------------- | :------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `matcher`         | string  | `PreToolUse` 및 `PostToolUse` 전용입니다. 정규표현식으로 실행 대상 도구를 지정합니다 (예: `run_command`, `""` 또는 `"*"`는 전체 도구 매칭, `run_command\|view_file`, `browser_.*`). 그 외 이벤트에서는 무시됩니다. |
| `hooks`           | array   | 실행할 훅 핸들러 객체의 배열입니다.                                                                                                                                               |
| `hooks[].command` | string  | 필수(Required). 실행할 셸 명령어 또는 스크립트 경로입니다.                                                                                                                             |
| `hooks[].type`    | string  | 선택(Optional). 현재는 `"command"`만 지원되며 기본값입니다.                                                                                                                        |
| `hooks[].timeout` | integer | 선택(Optional). 프로세스 실행 제한 시간(초)입니다. 기본값은 `30`초입니다.                                                                                                                  |

## Skill & Rule 과의 차이

Antigravity의 커스터마이징 시스템은 역할, 컨텍스트 점유 상태, 그리고 결정성(Determinism) 측면에서 명확히 구분됩니다.

가장 본질적인 차이는 **호출 보장 여부**에 있습니다. 스킬(Skill)과 규칙(Rule)은 LLM의 컨텍스트 윈도우(Context Window)를 점유하는 프롬프트 기반 지침이므로, 대화가 길어져 컨텍스트 압축(Compaction)이 발생하거나 모델의 주의력(Attention)이 분산되면 호출 및 준수 여부가 **비결정적(Non-deterministic)** 입니다. 반면, 훅(Hook)은 모델의 컨텍스트 상태나 토큰 점유율과 완전히 독립되어 Antigravity 런타임의 실행 루프(Lifecycle)에 하드웨어 레벨로 결합되어 있으므로, 조건 충족 시 호스트 시스템에서 **반드시 호출되는 결정론적(Deterministic) 이벤트**입니다.

| 구분           | [[Antigravity Skills\|Skill]]        | [[Antigravity Rules\|Rule]]         | Hook                                        |
| :----------- | :----------------------------------- | :---------------------------------- | :------------------------------------------ |
| **목적**       | 복잡한 워크플로우 실행 매뉴얼(Runbook) 제공         | 프로젝트 컨벤션 및 행동 제약 정의                 | 실행 루프 가로채기 및 정책 강제(Guardrail)               |
| **결정성 및 보장** | **비결정적** (컨텍스트 점유 및 모델 해석에 따라 누락 가능) | **비결정적** (컨텍스트 압축 및 주의력 분산 시 무시 가능) | **결정론적** (컨텍스트 상태와 무관하게 수명 주기에서 100% 호출 보장) |
| **컨텍스트 점유**  | 단계적 공개 메커니즘을 통해 동적 점유                | 시스템 프롬프트 공간을 상시 또는 조건부 점유           | 컨텍스트를 점유하지 않고 OS 서브프로세스로 분리 실행              |
| **제어 수준**    | 권고/가이드라인 (소프트 제어)                    | 프롬프트 레벨 제약 (소프트 제어)                 | 프로세스 차단 및 강제 개입 (하드 제어)                     |
| **동작 시점**    | 슬래시 명령 또는 프롬프트 키워드 감지 시 온디맨드 로드      | 세션 시작 및 도구/작업 전후 프롬프트에 지속 주입        | 에이전트 생명주기 이벤트 발생 시 기계적 동기 실행                |
| **실행 주체**    | 에이전트(LLM)가 해석하여 실행                   | 에이전트(LLM)의 추론에 반영                   | 호스트 시스템의 셸 서브프로세스                           |
| **형식**       | `SKILL.md` 디렉터리 구조                   | 마크다운(`.md`) 파일                      | `hooks.json` 매니페스트 및 독립 실행 스크립트             |
| **오버라이드 권한** | 불가 (에이전트가 도구 호출 결정)                  | 불가 (에이전트가 규약 위반 가능성 존재)             | 가능 (도구 실행 거부, 강제 재실행, 종료 차단)                |

## Hook 종류

Antigravity의 실행 루프는 총 5가지의 수명 주기 이벤트를 제공합니다.

### PreToolUse

에이전트가 도구를 실행하기 직전에 호출됩니다.

- **도구 매칭**: `matcher` 필드의 정규표현식을 통해 특정 도구에만 한정할 수 있습니다.
- **주요 활용**: 위험 명령어 차단, 프로덕션 환경 접근 통제, 휴먼 인 더 루프(Human-in-the-Loop) 승인 요청 강제, 동적 권한 오버라이드.
- **결정 제어**: 스크립트가 표준 출력으로 반환하는 `decision` 값에 따라 도구 실행이 즉시 차단되거나 승인 프롬프트가 표시됩니다.

### PostToolUse

도구 실행이 완료된 직후 호출됩니다.

- **도구 매칭**: `matcher` 필드의 정규표현식을 지원합니다.
- **주요 활용**: 파일 생성 및 수정 도구 완료 직후 린터(Linter)나 포맷터 실행, 도구 런타임 오류 감지 및 감사 로그 기록.
- **특징**: `v1.1.9` 업데이트를 통해 비도구 단계(사용자 입력, 모델 응답 등)에서 잘못 트리거되던 문제가 해결되어 도구 실행 단계에서만 정확하게 호출됩니다.

### PreInvocation

에이전트가 추론 모델을 호출하기 직전에 실행(호출)됩니다.

> [!tip] 턴(Turn) 단위 제어
> 사용자가 새 프롬프트를 입력했을 때 가장 먼저 실행되는 훅입니다. 단, 도구를 연속 사용하는 다단계 턴에서는 매 모델 호출 시점마다 반복 호출되므로, 사용자 프롬프트당 1회만 실행하려면 `invocationNum == 0` 조건을 확인하여 분기합니다.

- **도구 매칭**: 지원하지 않으며, 모든 모델 호출 직전에 실행됩니다.
- **주요 활용**: 외부 상태(환경 변수, Git 상태, 최신 티켓 정보 등)를 조회하여 대화 궤적(Trajectory)에 임시 안내 메시지(`ephemeralMessage`)나 시스템 메시지를 주입.
- **호출 제어**: 첫 번째 모델 호출은 `invocationNum: 0`으로 시작하며, 다단계 추론 턴마다 인덱스가 갱신됩니다.

### PostInvocation

모델의 응답 생성 및 도구 파싱이 완료된 직후 호출됩니다.

- **도구 매칭**: 지원하지 않습니다.
- **주요 활용**: 모델 응답 결과에 따라 추가 스텝을 강제 주입하거나, 루프 지속 여부(`terminationBehavior`)를 제어.
- **실행 순서**: `v1.1.10` 개선을 통해 내장 종료 검사보다 먼저 실행되므로, 한 턴의 마지막 모델 호출 결과까지 안정적으로 관찰할 수 있습니다.

### Stop

에이전트가 작업을 완료하거나 최대 스텝 도달 등의 이유로 실행 루프를 종료하려 할 때 호출됩니다.

- **도구 매칭**: 지원하지 않습니다.
- **주요 활용**: 정의된 요구사항(단위 테스트 통과, 문서화 여부 등)을 검증하여, 미완료 시 종료를 저지하고 에이전트를 다시 실행 루프로 복귀(`decision: "continue"`).
- **무한 루프 방지**: `v1.1.9`에서 방어 로직이 추가되어, Stop 훅이 계속해서 차단하더라도 설정된 최대 연속 continuation 임계값을 초과하면 안전하게 세션이 종료됩니다.

## 지원 필드

훅 프로세스는 표준 입력(`stdin`)을 통해 JSON 형식으로 컨텍스트를 전달받고, 표준 출력(`stdout`)을 통해 JSON 형식으로 결정 결과를 반환합니다. 모든 필드명은 `camelCase` 규격을 사용합니다.

### 공통 입력 필드 (stdin)

모든 훅 이벤트는 실행 시 다음 공통 메타데이터를 `stdin`으로 수신합니다.

| 필드 | 타입 | 설명 |
| :--- | :--- | :--- |
| `conversationId` | string | 현재 활성 대화 세션의 고유 UUID입니다. |
| `workspacePaths` | array of strings | 마운트된 작업 공간의 절대 디렉터리 경로 목록입니다. |
| `transcriptPath` | string | 대화 로그 파일(`transcript.jsonl`)의 절대 경로입니다. `<app_data_dir>/brain/<conversationId>/.system_generated/logs/transcript.jsonl`에 위치합니다. |
| `artifactDirectoryPath` | string | 대화 아티팩트 및 스크린샷이 저장되는 디렉터리의 절대 경로입니다. |
| `modelName` | string | 호출에 사용 중인 모델 식별자(예: `gemini-3.6-flash-medium`)입니다. |

### 이벤트별 입출력 계약

#### PreToolUse

- **입력 (`stdin`)**:
	- `toolCall` (object): 호출하려는 도구 세부 정보 (`name`, `args`).
	- `stepIdx` (integer): 현재 궤적의 0 기반 스텝 인덱스.
	- 공통 메타데이터 필드 포함.
- **출력 (`stdout`)**:
	- `decision` (필수, string): 도구 실행 제어 방식.
		- `"allow"`: 도구 실행을 즉시 자동 허용합니다.
		- `"deny"`: 도구 실행을 즉시 하드 블록합니다.
		- `"ask"`: 사용자에게 승인을 요청하되 "Always Allow" 캐시를 존중합니다.
		- `"force_ask"`: 캐시된 권한을 무시하고 사용자에게 항상 승인을 요청합니다.
		- `"deny_unless_prior_grant"`: 이전에 승인된 권한이 없는 경우 실행을 거부합니다.
	- `reason` (선택, string): 사용자 승인 프롬프트나 에이전트에 노출할 결정 사유입니다 (`v1.1.28`부터 프롬프트에 `Reason:` 라인으로 표시).
	- `permissionOverrides` (선택, array of strings): 도구의 기본 권한을 덮어쓸 리소스 문자열 배열(예: `["command(npm test)"]`).

#### PostToolUse

- **입력 (`stdin`)**:
	- `toolCall` (object): 실행된 도구의 `name` 및 `args`.
	- `stepIdx` (integer): 완료된 스텝 인덱스.
	- `error` (선택, string): 도구 실행 실패 시 런타임 에러 메시지(성공 시 빈 문자열).
	- 공통 메타데이터 필드 포함.
- **출력 (`stdout`)**:
	- 빈 JSON 객체 `{}`를 반환합니다.

#### PreInvocation

- **입력 (`stdin`)**:
	- `invocationNum` (integer): 모델 호출 시퀀스 번호 (첫 호출은 `0`).
	- `initialNumSteps` (integer): 현재 궤적 내에 존재하는 스텝 수.
	- 공통 메타데이터 필드 포함.
- **출력 (`stdout`)**:
	- `injectSteps` (선택, array of objects): 모델 호출 전 궤적에 주입할 스텝 배열입니다. 객체는 `toolCall`, `userMessage`, `ephemeralMessage` 중 하나를 포함할 수 있습니다.

#### PostInvocation

- **입력 (`stdin`)**:
	- `invocationNum` (integer) 및 `initialNumSteps` (integer).
	- 공통 메타데이터 필드 포함.
- **출력 (`stdout`)**:
	- `injectSteps` (선택, array of objects): 호출 완료 후 주입할 스텝 목록.
	- `terminationBehavior` (선택, string): 실행 흐름 제어 플래그 (`"force_continue"`, `"terminate"`, `""`).

#### Stop

- **입력 (`stdin`)**:
	- `executionNum` (integer): 실행 시도 시퀀스 번호.
	- `terminationReason` (string): 종료 원인 (예: `"model_stop"`, `"max_steps_exceeded"`, `"error"`).
	- `error` (선택, string): 시스템 에러로 인한 종료 시 상세 오류 메시지.
	- `fullyIdle` (필수, boolean): 백그라운드 태스크나 비동기 작업이 모두 완료되었으면 `true`, 실행 중인 백그라운드 작업이 남아있으면 `false`.
	- 공통 메타데이터 필드 포함.
- **출력 (`stdout`)**:
	- `decision` (필수, string): `"continue"`로 지정하면 종료를 취소하고 실행 루프에 다시 진입합니다.
	- `reason` (선택, string): `decision`이 `"continue"`일 때 에이전트에 시스템 메시지로 주입될 재실행 사유입니다.

## User Level 등록 방식

전역 사용자 환경에 훅을 등록하면 모든 프로젝트 및 작업 세션에서 공통으로 적용됩니다.

```text
~/.gemini/config/hooks.json
```

- **설정 파일 관리**: 전역 훅은 `~/.gemini/config/hooks.json` 단일 파일에서 중앙 집중식으로 관리합니다.
- **CLI 연동**: Antigravity CLI TUI에서 `/hooks` 명령어를 실행하여 등록된 전역 훅의 상태를 확인하고 토글할 수 있습니다 (초기 `1.0.8` 버전에서 레거시 경로에 쓰이던 버그가 해결되어 `config/hooks.json`과 완전하게 동기화됩니다).
- **플러그인 훅 연동**: 활성화된 플러그인에 번들된 훅은 `v1.2.3` 이전에도 실제로는 실행되고 있었으나, `/hooks` 명령어 및 훅 점검 유틸리티의 목록에서는 누락되어 있었습니다. `v1.2.3`부터 이 누락 버그가 수정되어, 플러그인 번들 훅도 전역 훅 목록에서 빠짐없이 확인할 수 있습니다.
- **헤드리스 모드 지원**: `v1.1.12`부터 `agy -p "/hooks"` 명령어를 통해 쿼터 소모 없이 활성 훅 목록을 TSV나 JSON 형태로 비대화형 파이프라인에서 추출할 수 있습니다.

## Project Level 등록 방식

프로젝트 단위로 훅을 등록할 때는 작업 공간 루트의 `.agents/` 디렉터리를 사용합니다.

```text
<workspace-root>/.agents/hooks.json
```

- **저장소 형상 관리**: `.agents/hooks.json` 설정 파일과 실행 스크립트(예: `./scripts/safety-check.sh`, `./scripts/lint.sh`)를 Git 저장소에 함께 커밋하면, 저장소를 클론한 모든 팀원이 별도의 개인 로컬 설정 없이 동일한 프로젝트 품질 및 보안 가드레일을 강제 적용받습니다.
- **작업 공간 신뢰 및 리로드**: `v1.1.1` 업데이트를 통해 새로운 프로젝트 폴더를 신뢰(Trust)하거나 작업 공간을 전환할 때 훅 엔진이 디렉터리를 자동으로 재스캔하여 변경 사항을 즉시 반영합니다.
- **상대 경로 실행**: 훅 명령어의 상대 경로는 워크스페이스 루트 경로를 기준으로 실행되므로, 이식성 있는 프로젝트 빌드 및 검증 스크립트 작성이 가능합니다.

## Reference

- [Google Antigravity Documentation](https://antigravity.google/docs)
- [Antigravity Hooks Documentation](https://antigravity.google/docs/hooks)
- [Google Antigravity Changelog](https://antigravity.google/changelog)
- [Antigravity CLI 1.0.8 Release Notes (hooks.json Config Path Fix)](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.0.8)
- [Antigravity CLI 1.0.16 Release Notes (Empty Pre-Tool Hook Decision Handling)](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.0.16)
- [Antigravity CLI 1.1.1 Release Notes (Workspace Hooks Reloading)](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.1.1)
- [Antigravity CLI 1.1.7 Release Notes (Disabled Plugin Hooks Cleanup)](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.1.7)
- [Antigravity CLI 1.1.9 Release Notes (Stop Hooks Loop Guard & PostToolUse Event Fix)](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.1.9)
- [Antigravity CLI 1.1.10 Release Notes (Hook Execution Ordering)](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.1.10)
- [Antigravity CLI 1.1.12 Release Notes (Print Mode /hooks Support)](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.1.12)
- [Antigravity CLI 1.1.28 Release Notes (Tool Approval Reason from Hooks)](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.1.28)
- [Antigravity CLI 1.2.3 Release Notes (Plugin Bundled Hooks Discovery)](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.2.3)
- [Antigravity CLI 1.2.4 Release Notes (Token Budget Truncation Fix)](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.2.4)
