# Phase 1 Data Model: Giscus 게시글 댓글

이 기능은 이 애플리케이션 안에 새로운 영속 데이터나 서버 상태를 도입하지 않는다. spec.md의 Key Entities는 모두 GitHub Discussions(외부 서비스, `Revi1337/revi-blog-comments` 저장소)가 소유하고 저장하며, 이 앱은 giscus 위젯을 통해 그 데이터를 읽기/쓰기 프록시로만 표시한다.

## 엔티티 (외부 소유, 참조용)

### 댓글 (Comment)
- **소유 주체**: GitHub Discussions (`Revi1337/revi-blog-comments`)
- **속성**: 작성자 GitHub 아이덴티티, 본문(마크다운), 작성 시각, 반응 목록
- **이 앱에서의 역할**: 저장/조회 로직 없음 — `<Giscus>` iframe이 GitHub API를 직접 호출해 렌더링한다.

### 반응 (Reaction)
- **소유 주체**: GitHub Discussions
- **속성**: 이모지 종류, 집계 카운트
- **이 앱에서의 역할**: `reactionsEnabled="1"` 설정으로 표시만 활성화하며, 별도 상태 관리 없음.

### 게시글-댓글 매핑
- **소유 주체**: GitHub Discussions의 Discussion 제목 ↔ giscus `mapping="pathname"`
- **매핑 키**: 게시글의 URL 경로(`/article/[slug]`)
- **이 앱에서의 역할**: `<Giscus>`에 `mapping="pathname"`을 전달하는 것 외에 별도 매핑 테이블이나 slug↔discussion 대응 로직을 자체 구현하지 않는다. 최초 댓글 작성 시 giscus가 해당 경로 제목의 Discussion을 자동 생성한다.

## 이 앱 내부 상태 (UI 파생 값)

- **`isDark`**: `components/theme/theme-context.tsx`의 `useTheme()`이 이미 관리하는 기존 상태. 이 기능은 새 상태를 추가하지 않고, `isDark`를 `<Giscus theme={...}>` prop으로 파생 전달만 한다 (research.md #3 참조).

## 결론

Key Entities는 문서화 목적(요구사항 추적성)으로만 spec.md에 존재하며, 구현 관점에서는 별도 스키마·마이그레이션·상태 관리가 필요 없다.
