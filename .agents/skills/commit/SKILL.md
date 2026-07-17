---
name: commit
description: Use this skill whenever creating a git commit in this repository, or drafting/reviewing a commit message for the user before they commit. This project has its own commit-message convention that overrides the default style (including the default Co-Authored-By footer) — a Conventional Commits type prefix (feat/fix/refactor/chore/docs) followed by a Korean subject, a mandatory Korean body explaining the change and the reasoning behind it, and no footer of any kind. Always apply this skill instead of a generic commit message format, even for small or "obvious" changes.
---

# Commit 컨벤션

이 프로젝트의 커밋 메시지는 아래 규칙을 따른다. 커밋 로그가 나중에 "무엇을, 왜" 바꿨는지 알려주는 유일한 기록이 되므로, 제목만 던지고 끝내지 않는다.

## 1. 제목 형식
제목은 `<type>: <한국어 설명>` 형태로 쓴다. `type`은 변경의 성격을 한눈에 보여주는 Conventional Commits 접두사이고, 그 뒤 설명은 한국어로 작성한다 (본문도 마찬가지로 전부 한국어).

주로 쓰는 type:
- `feat`: 새 기능 추가
- `fix`: 버그 수정
- `refactor`: 동작 변화 없는 구조 개선
- `chore`: 빌드/설정/의존성 등 코드 외적인 잡무
- `docs`: 문서만 변경

예: `feat: 다크/라이트 테마 토글 버튼 추가`

## 2. 본문(Body)은 반드시 작성
본문 없는 한 줄짜리 커밋을 만들지 않는다. 본문에는 다음 두 가지가 담겨야 한다.
- 무엇이 바뀌었는가
- 왜 그렇게 바꾸기로 했는가 (의사결정 근거, 트레이드오프, 대안을 버린 이유 등)

형식은 나열식 문장이 아니라 `-`로 시작하는 불릿이어야 한다. 각 불릿은 "무엇을 + 왜"가 한 문장 안에 같이 드러나도록 쓴다.

예시:
```
fix: core/*.html의 폰트를 Geist에서 Inter/JetBrains Mono로 통일

- 4개 화면(dark/light × home/article)에서 Geist가 남아있던 부분을 Inter로 교체 — CLAUDE.md의 폰트 규칙과 어긋나 있었음
- 코드/라벨류만 JetBrains Mono로 분리 — 본문과 코드가 시각적으로 구분되지 않는다는 피드백 반영
```

## 3. Footer는 절대 사용하지 않음
커밋 메시지는 제목과 본문으로 끝난다. 그 아래에 어떤 트레일러도 붙이지 않는다 — `Co-Authored-By:` 같은 서명 줄이 대표적이다. Claude Code는 기본적으로 커밋에 `Co-Authored-By: Claude ...` 줄을 자동으로 추가하지만, 이 저장소에서는 이 스킬이 그 기본 동작을 오버라이드한다. 어떤 이유로든 footer/트레일러 줄을 추가하지 않는다.

## 실행 절차
1. `git status`와 `git diff --staged` (스테이징 전이면 `git diff`)로 실제 변경 내용을 확인한다.
2. 위 규칙에 따라 제목 + 본문을 작성한다. 본문은 `-` 불릿, footer 없음.
3. heredoc으로 커밋한다. Co-Authored-By 줄을 넣지 않도록 주의한다.
   ```bash
   git commit -m "$(cat <<'EOF'
   <제목>

   - <본문 불릿 1>
   - <본문 불릿 2>
   EOF
   )"
   ```
4. `git status`로 커밋이 정상적으로 반영됐는지 확인한다.
