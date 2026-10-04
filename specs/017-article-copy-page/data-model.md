# Phase 1 Data Model: 아티클 Copy Page 메뉴

이 기능은 새로운 영속 엔티티를 만들지 않는다 — 기존 `content/articles/**` 파일이 그대로 "원문"의 소스이며, 이 문서는 그 원문이 로드부터 응답까지 거치는 파생 데이터 형태만 기술한다.

## RawMarkdownCache (신규 — 빌드/서버 시작 시 파생되는 메모리 캐시)

`lib/content/loader.ts`의 `loadArticles()`가 반환하고, `lib/data/articles.ts`가 모듈 스코프에 들고 있는 `Map<string, string>`.

| Key | Value | Description |
|---|---|---|
| `slug` | `string` | `Article.slug`와 동일한 식별자 — 별도 조회 키 체계를 만들지 않고 기존 slug를 그대로 재사용 |
| (map value) | `string` | 해당 글 파일의 전체 원문(프론트매터 YAML 블록 + 본문, 저자가 작성한 그대로)에서 `stripComments()`로 `%%...%%` 비공개 메모만 제거한 문자열 |

**Derivation**: `loadArticles()`가 각 마크다운 파일을 읽을 때 이미 얻는 `raw`(현재는 frontmatter/본문으로 쪼갠 뒤 버려짐)를 버리지 않고, `stripComments(raw)` 결과를 slug와 함께 이 `Map`에 적재한다. `Article[]`을 만드는 기존 파이프라인(프론트매터 파싱 → 마크다운 렌더링 → `bodyHtml`/`plainBody` 계산)과는 완전히 독립된 부산물이다 — 하나를 계산해도 다른 하나에 영향을 주지 않는다.

**Validation rules**: 없음 — 이미 `loadArticles()`가 전체 파이프라인에서 보장하는 것(파일이 읽혔다는 것, slug가 유일하다는 것 — `assertNoDuplicateSlugs`)을 그대로 상속받는다. 이 캐시만을 위한 별도 무결성 검사는 필요 없다.

**Lifetime**: 프로세스 생애주기 동안 불변(`Article[]`/`blogCards`와 동일한 top-level await 캐싱 전제) — `content/articles/**` 수정 후 반영하려면 `next dev` 재시작이 필요하다(constitution Principle I, 기존 제약 그대로 적용).

## Article (기존 타입 — 변경 없음)

**이 기능은 `Article` 인터페이스에 어떤 필드도 추가하지 않는다** (plan.md Constraints 참고). `RawMarkdownCache`는 `Article[]`과 나란히 존재하는 완전히 별도의 산출물이며, `Article` 객체를 통해서는 원문에 접근할 수 없다 — 오직 `getArticleRawMarkdown(slug)` 함수를 통해서만 접근 가능하고, 이 함수는 신규 Route Handler에서만 호출된다.

## LoadedContent (기존 타입 — 필드 추가)

`lib/content/loader.ts`의 `loadArticles()` 반환 타입.

```text
LoadedContent {
  articles: Article[]              // (기존, 변경 없음)
  blogSlugs: string[]               // (기존, 변경 없음)
  rawMarkdownBySlug: Map<string, string>   // [NEW]
}
```

## Relationships

```text
content/articles/**.md (파일) ──1:1──> RawMarkdownCache[slug]   # stripComments() 통과 후 적재
content/articles/**.md (파일) ──1:1──> Article                  # 기존 파이프라인, 완전히 독립적으로 파생
Article.slug ────────(동일 식별자 재사용, FK 아님)───> RawMarkdownCache의 key
```

## State Transitions

없음 — 이 기능이 다루는 데이터는 전부 빌드/서버 시작 시 정적으로 계산되는 불변 캐시다. 클라이언트에서 변하는 상태는 컴포넌트 로컬에만 존재하며 어디에도 영속화되지 않는다:

- `copy-page-menu.tsx`의 드롭다운 열림/닫힘 (`useState`) — `toc-sidebar.tsx` 모바일 드로어와 동일한 성격.
- "Copy Page" 클릭 후 성공/실패 피드백 상태 — `code-copy-handler.tsx`의 `is-copied` 클래스 토글과 동일한 성격(일정 시간 후 자동으로 원래 상태로 복귀).
