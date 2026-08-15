---
title: Diagram Preview (내부 검증용)
date: 2026-08-15 00:00
tags:
  - TEST
show_on_homepage: false
---

## Mermaid — 플로우차트

```mermaid
flowchart TD
    A[시작] --> B{조건 확인}
    B -->|Yes| C[처리]
    B -->|No| D[종료]
    C --> D
```

## Mermaid — 시퀀스 다이어그램

```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: 요청
    Bob-->>Alice: 응답
    Alice->>Bob: 후속 요청
    activate Bob
    Bob-->>Alice: 처리 완료
    deactivate Bob
```

## Mermaid — 클래스 다이어그램

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +fetch()
    }
    class Cat {
        +scratch()
    }
    Animal <|-- Dog
    Animal <|-- Cat
```

## Mermaid — 상태 다이어그램

```mermaid
stateDiagram-v2
    [*] --> 대기중
    대기중 --> 처리중 : 요청 수신
    처리중 --> 완료 : 성공
    처리중 --> 실패 : 오류
    완료 --> [*]
    실패 --> [*]
```

## Mermaid — ER 다이어그램

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    USER {
        string name
        string email
    }
    ORDER {
        int id
        date created_at
    }
```

## Mermaid — 파이 차트

```mermaid
pie title 언어별 사용 비중
    "TypeScript" : 45
    "Python" : 30
    "Java" : 15
    "기타" : 10
```

## Mermaid — 마인드맵

```mermaid
mindmap
  root((블로그 아키텍처))
    콘텐츠 파이프라인
      remark/rehype
      커스텀 플러그인
        콜아웃
        하이라이트
    다이어그램 렌더링
      Mermaid
      PlantUML
      Markmap
    방문자 통계
      Upstash Redis
      Edge/Node 런타임 분리
```

---

## PlantUML — 시퀀스 다이어그램

```plantuml
@startuml
Alice -> Bob: 요청
Bob --> Alice: 응답
Alice -> Bob: 후속 요청
activate Bob
Bob --> Alice: 처리 완료
deactivate Bob
@enduml
```

## PlantUML — 클래스 다이어그램

```plantuml
@startuml
class Animal {
    +String name
    +int age
    +makeSound()
}
class Dog {
    +fetch()
}
class Cat {
    +scratch()
}
Animal <|-- Dog
Animal <|-- Cat
@enduml
```

## PlantUML — 유스케이스 다이어그램

```plantuml
@startuml
left to right direction
actor 사용자
actor 관리자
usecase "로그인" as UC1
usecase "글 작성" as UC2
usecase "글 삭제" as UC3
사용자 --> UC1
사용자 --> UC2
관리자 --> UC3
@enduml
```

## PlantUML — 액티비티 다이어그램

```plantuml
@startuml
start
:요청 수신;
if (인증 성공?) then (yes)
    :처리;
    :응답 반환;
else (no)
    :오류 반환;
endif
stop
@enduml
```

## PlantUML — 상태 다이어그램

```plantuml
@startuml
[*] --> 대기중
대기중 --> 처리중 : 요청 수신
처리중 --> 완료 : 성공
처리중 --> 실패 : 오류
완료 --> [*]
실패 --> [*]
@enduml
```

## PlantUML — 컴포넌트 다이어그램

```plantuml
@startuml
package "웹 서버" {
    [API Gateway]
    [Auth Service]
}
database "PostgreSQL" as DB
[API Gateway] --> [Auth Service]
[Auth Service] --> DB
@enduml
```

## PlantUML — 렌더링 실패 다이어그램 (페이지가 죽으면 안 됨)

```plantuml
@startuml
qwerty totally not valid plantuml keyword blah blah
@enduml
```

---

## Markmap — 마인드맵

```markmap
# 블로그 아키텍처
## 콘텐츠 파이프라인
- remark/rehype
- 커스텀 플러그인
  - 콜아웃
  - 하이라이트
## 다이어그램 렌더링
- Mermaid
- PlantUML
- Markmap
## 방문자 통계
- Upstash Redis
- Edge/Node 런타임 분리
```

## Markmap — 마인드맵2

```markmap
# Root
## Sub1
## Sub2
```

## Markmap — 깊은 트리 (레이아웃 폭 초과 확인용)

```markmap
# 루트
## A
### A-1
#### A-1-1
##### A-1-1-1
###### A-1-1-1-1
## B
### B-1
### B-2
### B-3
### B-4
### B-5
```

## Markmap — 넓은 트리 (세로 높이 초과 확인용)

```markmap
# 루트
## 가지1
- 잎1
- 잎2
- 잎3
- 잎4
- 잎5
- 잎6
- 잎7
- 잎8
- 잎9
- 잎10
- 잎11
- 잎12
- 잎13
- 잎14
- 잎15
```

---

## 언어 라벨 — 짧은 언어명

```bash
echo "hello"
```

## 언어 라벨 — 긴 언어명 (ellipsis 확인용)

```typescript
const x: number = 1
```

## 언어 라벨 — 매우 긴 가짜 언어명 (max-width 초과 확인용)

```verylonglanguagenamefortestingellipsis
just testing overflow
```

## title= 메타 — 짧은 파일명 (가운데 정렬 확인용)

```js title="app.js"
console.log("hello")
```

## title= 메타 — 긴 파일명 (가운데 정렬 + ellipsis 동시 확인용)

```js title="a-very-long-configuration-filename-example.config.js"
console.log("hello")
```

## title= + Mermaid — 라벨과 title 동시 표시 확인용

```mermaid title="흐름도.mmd"
flowchart TD
    A[시작] --> B[종료]
```
