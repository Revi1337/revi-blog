---
title: Queue
date: 2026-07-02
updated_at: 2026-09-06 19:55
tags:
  - datastructure
  - queue
  - concept
description: 선입선출(FIFO) 방식으로 한쪽 끝에서 삽입하고 다른쪽 끝에서 제거하는 큐(Queue) 자료구조 개념
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Queue-thumbnail.jpg
audio:
  - https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/media/2026-09-06/Queue-script.mp3
---

## Queue

큐(Queue)는 데이터가 연속적(논리적)으로 저장되어 있는 선형 자료구조로, 먼저 들어온 데이터가 먼저 나가는 `FIFO(First In First Out)` 구조를 따릅니다. `한쪽 끝(뒤 : rear)에서 데이터를 추가(enqueue)`하고, `다른 한쪽 끝(앞 : front)에서 데이터를 제거(dequeue)`하는 방식으로 동작합니다.

- i 번째 데이터에 접근(Access)하는데 `O(N)`의 시간복잡도를 가집니다.
- 맨 앞(front)의 데이터에 접근 & 삭제에 `O(1)`의 시간복잡도를 가집니다.
- 맨 뒤(rear)에 데이터를 추가하는데 `O(1)`의 시간복잡도를 가집니다.
- X 라는 데이터가 있는지 탐색하는데 `O(N)`의 시간복잡도를 가집니다.

![Pasted image 20250606230341](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250606230341.png)

## Deque

덱(Deque, Double Ended Queue)는 큐와는 달리 `양쪽 끝(front와 rear) 모두에서 데이터를 추가하거나 제거할 수 있는 선형 자료구조`입니다. 즉, 앞쪽과 뒤쪽 모두에서 enqueue(삽입) 및 dequeue(삭제) 작업이 가능하며, 이는 Stack 과 Queue 의 역할을 모두 수행할 수 있음을 의미합니다.

> 양방향으로 데이터를 삽입/삭제할 수 있기 때문에, 일반적인 큐와 달리 FIFO 구조로 볼 수 없습니다.

- i 번째 데이터에 접근(Access)하는데 `O(N)`의 시간복잡도를 가집니다.
- 맨 앞(front)과 맨 뒤(rear)에 데이터에 접근 & 추가 & 삭제에 `O(1)`의 시간복잡도를 가집니다.
- X 라는 데이터가 있는지 탐색하는데 `O(N)`의 시간복잡도를 가집니다.

> 그림 상 Add First(8) 에서 10이 한 칸 밀리는 것처럼 보이지만, 10이 저장된 위치가 변경되는 것은 아님에 유의해야 합니다.

![Pasted image 20250607001642](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250607001642.png)


## Reference

- [김희성님 유튜브](https://www.youtube.com/watch?v=sPUvJOgODmI&list=PLHOy1E8axXrfJJtDIXIOQBmWRPwM-GxSf&index=1)