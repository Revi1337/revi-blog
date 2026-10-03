---
title: Antigravity Skills
date: 2026-10-03 23:37
updated_at: 2026-10-04 00:43
tags:
  - ai
  - google
  - antigravity
  - skills
description: "Google Antigravity의 스킬 작성 규격과 유저 및 프로젝트 레벨 등록 방식, 우선순위를 정리한 가이드입니다."
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-10-04/Antigravity-Skills-thumbnail.png
---

## 개요

> Antigravity CLI 1.2.16 기준으로 작성되었습니다.

스킬(Skill)은 특정 작업이나 복잡한 워크플로우(테스트, 빌드, 배포, 특정 도구 사용 등)를 에이전트가 실수 없이 일관되게 수행할 수 있도록 절차를 정의해 둔 실행 매뉴얼(Runbook)입니다. 사용자가 슬래시 명령어(`/<skill-name>`)로 직접 호출하거나 프롬프트에서 관련 작업을 지시하면, 에이전트가 이를 감지하여 매뉴얼의 절차와 스크립트를 찾아 실행합니다.

모델의 컨텍스트 창을 효율적으로 관리하기 위해 **단계적 공개(Progressive Disclosure)** 메커니즘을 사용하며, 평소에는 메타데이터만 메모리에 올려두고 필요할 때만 전체 지침을 로드합니다.

## Skill 명세 규격

스킬은 독립된 디렉터리 내에 `SKILL.md` 파일이 존재하는 형태로 구성됩니다.

```text
skills/<skill-name>/
├── SKILL.md          # 필수: 메인 지침 및 YAML 프론트매터
├── scripts/          # 선택: 실행 가능한 헬퍼 스크립트
├── references/       # 선택: 온디맨드로 참조할 상세 매뉴얼
└── resources/        # 선택: 템플릿 및 정적 에셋
```

`SKILL.md`의 프론트매터에는 다음 필드를 사용합니다.

```yaml
---
name: specialized-task-helper
description: >-
  이 스킬이 수행하는 작업과 활성화 조건을 서술합니다.
  사용자가 '특정 작업'을 요청할 때 이 스킬을 사용하세요.
compatibility: Requires specific CLI tools
version: 1.0.0
---
```

- `name` (필수): 소문자와 하이픈(`-`)으로 구성된 고유 식별자이며, 슬래시 명령어(`/<skill-name>`)로 매핑됩니다.
- `description` (필수): 에이전트가 프롬프트를 분석하여 스킬을 활성화할지 결정하는 가장 핵심적인 판단 기준입니다.
- `compatibility` (선택): 스킬 실행에 필요한 도구나 환경 의존성을 명시합니다.
- `version` (선택): 스킬의 버전 정보입니다.

## User Level 등록 방식

전역 사용자 환경에서 스킬을 등록하는 방법은 세 가지가 있습니다.

### 직접 디렉터리 배치

표준 전역 스킬 디렉터리에 직접 폴더를 생성하여 배치하는 방식입니다.

```text
~/.gemini/config/skills/<skill-name>/SKILL.md
```

모든 세션에서 기본으로 감지되지만, 외부 저장소와의 동기화를 위해 직접 복사(`cp -r`)를 반복해야 하는 번거로움이 있습니다.

### 심볼릭 링크 연동

외부에 위치한 스킬 폴더를 표준 디렉터리로 심볼릭 링크하여 연결합니다.

```bash
ln -s /path/to/my-skill ~/.gemini/config/skills/my-skill
```

초기 버전(`1.0.x`)에서는 심볼릭 링크 스캔 중 충돌이나 누락 버그가 존재했으나, `v1.1.3` 이후 디렉터리 탐색 엔진이 개편되면서 안정적으로 지원됩니다.

### skills json 매니페스트 등록

가장 권장되는 표준 방식으로, 심볼릭 링크를 생성하지 않고 `~/.gemini/config/skills.json` 매니페스트에 외부 부모 디렉터리 경로를 등록합니다.

```json
{
	"entries": [
		{
			"path": "/Users/username/.claude/skills",
			"exclude": [
				"grill-me",
				"grill-with-docs",
				"grilling"
			]
		},
		{
			"path": "/Users/username/.agents/skills",
			"include_only": ["defuddle", "excalidraw-skill"]
		}
	]
}
```

- `path(require)`: 스킬들이 위치한 디렉터리 경로를 지정합니다. 1레벨 깊이로 자동 스캔됩니다.
- `include_only(optional)`: 해당 경로 내에서 로드할 스킬을 화이트리스트로 지정합니다.
- `exclude(optional)`: 로드에서 제외할 스킬 이름을 지정합니다.

## Project Level 등록 방식

단일 프로젝트 혹은 팀 단위 협업 시에는 프로젝트 루트의 `.agents/` 디렉터리를 활용합니다.

- 디렉터리 직접 배치: `<project-root>/.agents/skills/<skill-name>/SKILL.md`
- 매니페스트 등록: `<project-root>/.agents/skills.json`

```json
{
	"entries": [
		{
			"path": "tools/custom-skills"
		}
	]
}
```

프로젝트 레벨 매니페스트는 작업 공간 기준의 **상대 경로**를 지원합니다. 스킬 폴더와 매니페스트를 Git 저장소에 커밋하면, 저장소를 클론한 모든 팀원이 별도의 개인 설정 없이 동일한 스킬을 즉시 사용할 수 있습니다.

## 우선순위

스킬 이름이 중복되는 경우 다음 우선순위에 따라 오버라이드됩니다.

1. 프로젝트 레벨 (`.agents/skills/` 및 `.agents/skills.json`)
2. 유저 글로벌 매니페스트 (`~/.gemini/config/skills.json`)
3. 유저 표준 디렉터리 (`~/.gemini/config/skills/`)
4. 내장 기본 스킬 (Built-in Skills)

## Best Practice

- **파일 복사 지양**: `.gemini/config/skills/` 내부에 파일을 직접 복사하지 않고 `skills.json`을 사용하여 중앙 집중식으로 경로를 관리합니다.
- **명확한 트리거 작성**: `description`에 무엇을 하는지뿐만 아니라, 사용자가 입력할 만한 구체적인 키워드와 상황을 포함하여 에이전트의 트리거 누락을 방지합니다.
- **컨텍스트 최적화**: `SKILL.md` 본문은 500줄 이하의 핵심 절차 위주로 간결하게 작성하고, 방대한 레퍼런스는 `references/` 디렉터리로 분리하여 온디맨드로 참조하도록 구성합니다.

## Reference

- [Google Antigravity Documentation](https://antigravity.google/docs)
- [Antigravity Skills Documentation](https://antigravity.google/docs/skills)
- [Google Antigravity Changelog](https://antigravity.google/changelog)
- [Antigravity CLI 1.1.3 Release Notes (Symlink Resolution)](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.1.3)
- [Antigravity CLI 1.2.10 Release Notes (skills.json Entries & include_only Overhaul)](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.2.10)
