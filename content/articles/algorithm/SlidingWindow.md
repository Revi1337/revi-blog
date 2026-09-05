---
title: SlidingWindow (슬라이딩 윈도우)
date: 2026-07-19
updated_at: 2026-07-28
tags:
  - algorithm
  - sliding-window
  - concept
description: 연속된 데이터 구조에서 고정된 크기의 창을 이동시키며 부분 배열을 O(N)으로 처리하는 슬라이딩 윈도우 알고리즘
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/SlidingWindow-thumbnail.jpg
audio:
  - https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/media/2026-09-06/SlidingWindow-script.mp3
---

## Sliding Window 란

Sliding Window 알고리즘은 배열이나 리스트와 같은 연속된 데이터 구조에서 `특정 크기의 부분 배열`(또는 부분 리스트)을 효율적으로 처리하기 위한 알고리즘입니다. 주로 연속된 데이터에서 최대값, 최소값, 평균값 등을 구하거나 특정 조건을 만족하는 부분 배열을 찾는 문제에서 사용됩니다.

> Sliding Window 는 컴퓨터 네트워크 프로토콜에서 유래되었습니다.


## Two Pointer 와의 관계

|   Algorithm    | 탐색 구간 |           Pointer 이동 (Left, Right)            |
| :------------: | :---: | :-------------------------------------------: |
|  Two Pointer   |  가변   | 독립적 (Left 는 커지는데 Right 는 작아져 탐색구간이 넓어질 수 있습니다.) |
| Sliding Window |  불변   |         공통 (Left 가 커지면 Right 도 커집니다.)          |

### 공통점

Two Pointer 알고리즘과 Sliding Window 알고리즘은 선형 자료구조를 2회 이상 반복적으로 탐색해야 할 경우 `O(N²)` 이상 걸릴 시간 복잡도를 부분 배열을 활용하여 `O(N)` 으로 줄일 수 있다는 공통점이 있습니다.

### 차이점

`Sliding Window 는 고정된 크기`의 부분 배열이나 부분 구간에서 연속적인 데이터 처리나 계산이 필요한 경우에 사용되지만, Two Pointer 는 가변 길이의 의 부분 배열이나 서브시퀀스를 탐색할 때 사용된다는 점에서 차이점이 있습니다.

또한, `Two Pointer` 는 `left`, `right` 포인터가 `서로 독립적으로 움직여` 탐색구간이 가변적이지만, `Sliding Window` 는 `left`, `right` 포인터가 `같이 움직여` 탐색구간이 고정적이라는 점에서 차이점이 있습니다.


## Sliding Window 의 동작 원리

**Init**
- 초기값으로 Window Size 만큼의 부분배열을 만듭니다.

**Step N**
- 이전 Step 의 부분배열의 `맨 앞 원소를 Window 에서 제거` 하고, `맨 뒤 원소의 다음 요소를 Window 에 추가`시켜주면 됩니다.

![Pasted image 20240817012435](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20240817012435.png)

## 백준 수열

[백준 수열](https://www.acmicpc.net/problem/2559) 문제가 Sliding Window 로 풀 수 있는 대표적인 문제입니다. 코드를 구현하면 아래와 같이 구현할 수 있습니다.

```python
def solution(N, K, temps):  
    left, right = 0, K  
    temp = sum(temps[left : right])  
    answer = temp  
    while right < N:  
        temp = temp - temps[left] + temps[right]  
        answer = max(answer, temp)  
        left, right = left + 1, right + 1  
    return answer  
  
N, K = map(int, input().split())  
temps = list(map(int, input().split()))  
print(solution(N, K, temps))
```


구현한 코드의 모든 Process 를 아래와 같이 그려볼 수 있습니다.

![Pasted image 20240817020527](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20240817020527.png)

![Pasted image 20240817015536](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20240817015536.png)

![Pasted image 20240817015707](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20240817015707.png)

![Pasted image 20240817015642](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20240817015642.png)

![Pasted image 20240817015754](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20240817015754.png)

![Pasted image 20240817015811](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20240817015811.png)
