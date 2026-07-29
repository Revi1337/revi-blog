---
title: Stack
date: 2026-07-01
tags:
  - datastructure
  - stack
  - concept
description: "후입선출(LIFO) 방식으로 한쪽 끝(Top)에서만 데이터의 추가와 제거가 일어나는 스택(Stack) 개념"
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Stack-thumbnail.jpg
---

## Stack

스택(Stack)은 데이터가 연속적(논리적)으로 연결되어 있는 선형 자료구조로, 마지막에 들어온 데이터가 먼저 나가는 `LIFO(Last In First Out)` 구조를 따릅니다. 즉, 데이터를 `한쪽 끝(맨 위 : top)에서만 추가(push)하거나 제거(pop)`하는 방식으로 동작합니다.

- i 번째 데이터에 접근(Access)하는데 `O(N)`의 시간복잡도를 가집니다.
- 맨 위(뒤) 데이터에 접근 & 추가 & 삭제하는데 `O(1)`의 시간복잡도를 가집니다.
- X 라는 데이터가 있는지 탐색하는데 `O(N)`의 시간복잡도를 가집니다.

> Stack 메모리를 초과하면 Stack Overflow Error 가 발생합니다. 이와 반대로 비어있는 Stack에서 pop 을 하면 Empty Stack Error 가 발생합니다.

![Pasted image 20250607012909](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250607012909.png)


스택은 대표적으로 프로세스 메모리 영역에 사용되며, 아래 그림에서 빨간 영역에 해당합니다. `Stack` 영역에는 함수의 복귀 주소(`Return Address`), 지역 변수(`Local Variable`) 저장 등의 용도로 사용됩니다.

- 이미지에서 `Stack`과 `Heap` 사이에 반대 방향으로 향하는 화살표는 각 메모리 영역의 성장 방향(`growth direction`)을 나타냅니다.
- Stack 은 `High Address → Low Address`로, Heap 은 `Low Address → High Address`로 확장 및 성장합니다.
- 서로를 향해 확장되므로, 메모리 부족이나 충돌이 발생할 수 있는 구조입니다.

![Pasted image 20250607013907](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250607013907.png)

## Reference

- [김희성님 유튜브](https://www.youtube.com/watch?v=sPUvJOgODmI&list=PLHOy1E8axXrfJJtDIXIOQBmWRPwM-GxSf&index=1)
