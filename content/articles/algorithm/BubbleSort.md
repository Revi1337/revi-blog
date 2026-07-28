---
title: "BubbleSort (버블 정렬)"
date: 2026-07-14
updated_at: 2026-07-28
tags:
  - algorithm
  - sort
  - concept
description: "인접한 두 원소를 비교하며 최댓값을 뒤로 보내는 제자리 정렬 알고리즘인 버블 정렬의 작동 원리와 구현"
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/BubbleSort-thumbnail.jpg
---

## Bubble Sort

버블 정렬(Bubble Sort) 은 `제자리 정렬(In-Place Sorting) 알고리즘` 중 하나입니다. 버블 정렬은 각 `라운드(Round)`마다 배열의 `첫 번째 원소부터 시작해서 인접한 원소들을 비교`하고, 그 `크기에 따라 값을 Swap` 해나가는 형태로 동작합니다. `각 라운드마다 비교 횟수가 점차 줄어`들며, 첫 번째 라운드에서는 `N - 1`번 비교하고, 두 번째 라운드에서는 `N - 2`번 비교하는 방식으로 진행됩니다. 이 과정을 반복하면서 배열이 점차 정렬됩니다.

- 각 Round 마다 비교 횟수가 줄어드는 이유는. 각 Round 가 끝날때마다 가장 큰 값이 뒤로 이동하기 떄문입니다.

> [!note] 제자리 정렬(In-Place Sorting) 알고리즘
> 제자리 정렬은 추가적인 메모리 공간을 거의 사용하지 않고 원래 주어진 배열 또는 리스트 내에서 요소들을 정렬하는 알고리즘을 말합니다.

> [!note] Round(라운드)
> Round(라운드) 는 반복적인 정렬 알고리즘에서 한 번의 주요 연산이 진행되는 단계를 의미합니다. 즉, 한 Round 마다 배열의 특정 부분 혹은 일부가 정렬되게 됩니다. N 개의 원소를 정렬하려면 N - 1 개의 Round 가 필요합니다. 라운드는 주로 선택 정렬, 버블 정렬, 삽입 정렬 같은 알고리즘에서 사용됩니다. 

## Process

길이가 N인 배열을 오름차순 정렬을 한다고 가정한다면 총 `N - 1` 라운드가 진행됩니다. 또한, 버블 정렬은 각 라운드마다 `배열의 첫 번째 원소(Index 0)`부터 탐색을 시작합니다. 그 과정은 다음과 같은 흐름으로 동작합니다.

1. Round 1
    - 배열의 첫 번째 원소(`Index 0`)와 인접한 두 번째 원소(`Index 1`)를 비교하고, `뒤에 있는 원소가 더 작다면`, 그 값이 `더 앞에 나올 수 있도록 비교했던 원소를 Swap`합니다.
    - 배열의 두 번째 원소(`Index 1`)와 인접한 세 번째 원소(`Index 2`)를 비교하고, `뒤에 있는 원소가 더 작다면`, 그 값이 `더 앞에 나올 수 있도록 비교했던 원소를 Swap`합니다.
    - 배열의 세 번째 원소(`Index 2`)와 인접한 네 번째 원소(`Index 3`)를 비교하고, `뒤에 있는 원소가 더 작다면`, 그 값이 `더 앞에 나올 수 있도록 비교했던 원소를 Swap`합니다.
    - ...
    - 배열의 (N - 1) 번째 원소(`Index N - 2`)와 인접한 마지막 원소(`Index N - 1`)를 비교하고, `뒤에 있는 원소가 더 작다면`, 그 값이 `더 앞에 나올 수 있도록 비교했던 원소를 Swap`합니다.
2. Round 2
    - 배열의 첫 번째 원소(`Index 0`)와 인접한 두 번째 원소(`Index 1`)를 비교하고, `뒤에 있는 원소가 더 작다면`, 그 값이 `더 앞에 나올 수 있도록 비교했던 원소를 Swap`합니다.
    - ...
    - 배열의 (N - 2) 번째 원소(`Index N - 3`)와 인접한 마지막 원소(`Index N - 2`)를 비교하고, `뒤에 있는 원소가 더 작다면`, 그 값이 `더 앞에 나올 수 있도록 비교했던 원소를 Swap`합니다.
3. Round 3
    - 배열의 첫 번째 원소(`Index 0`)와 인접한 두 번째 원소(`Index 1`)를 비교하고, `뒤에 있는 원소가 더 작다면`, 그 값이 `더 앞에 나올 수 있도록 비교했던 원소를 Swap`합니다.
    - ...
    - 배열의 (N - 3) 번째 원소(`Index N - 4`)와 인접한 마지막 원소(`Index N - 3`)를 비교하고, `뒤에 있는 원소가 더 작다면`, 그 값이 `더 앞에 나올 수 있도록 비교했던 원소를 Swap`합니다.
4. Round (N - 1)
    - 배열의 첫 번째 원소(`Index 0`)와 인접한 두 번째 원소(`Index 1`)를 비교하고, `뒤에 있는 원소가 더 작다면`, 그 값이 `더 앞에 나올 수 있도록 비교했던 원소를 Swap`합니다.
    - ...
    - 배열의 (N - 2) 번째 원소(`Index N - 3`)와 인접한 마지막 원소(`Index N - 2`)를 비교하고, `뒤에 있는 원소가 더 작다면`, 그 값이 `더 앞에 나올 수 있도록 비교했던 원소를 Swap`합니다.


말로면 설명하면 이해하기 어려울 수 있기 때문에, 길이가 5인 1차원 배열 `[8,5,6,2,4]` 을 오름차순하는 예시를 한번 살펴보겠습니다. 길이가 5 인 배열이니 총 4 개의 Round 가 동작하게 됩니다.

### Round 1

Round 1 정렬 프로세스입니다. Index 0 ~ (N - 2) 순서로 시작하여, 인접한 원소와 값을 비교하고 결과에 따라 값을 Swap 해줍니다.

1. Index 0 과 Index 1 을 비교합니다. Index 1 의 값이 더 작으니 `Index 0 과 값을 Swap` 합니다.
2. Index 1 과 Index 2 를 비교합니다. Index 2 의 값이 더 작으니 `Index 1 과 값을 Swap` 합니다.
3. Index 2 와 Index 3 을 비교합니다. Index 3 의 값이 더 작으니 `Index 2 와 값을 Swap` 합니다.
4. Index 3 과 Index 4 를 비교합니다. Index 4 의 값이 더 작으니 `Index 3 과 값을 Swap` 합니다.

> Round 1 이 종료된 시점에는 제일 큰 원소가 맨 뒤에 위치하게 됩니다.

![Pasted image 20250212145118](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250212145118.png)


### Round 2

Round 2 정렬 프로세스입니다. Index 0 ~ (N - 2) 순서로 시작하여, 인접한 원소와 값을 비교하고 결과에 따라 값을 Swap 해줍니다.

1. Index 0 과 Index 1 을 비교합니다. Index 0 의 값이 더 작으니 `값을 Swap 하지 않습니다`.
2. Index 1 과 Index 2 를 비교합니다. Index 2 의 값이 더 작으니 `Index 1 과 값을 Swap` 합니다.
3. Index 2 와 Index 3 을 비교합니다. Index 3 의 값이 더 작으니 `Index 2 와 값을 Swap` 합니다.
4. Index 3 과 Index 4 를 비교합니다. Index 3 의 값이 더 작으니 `값을 Swap 하지 않습니다`.

> Round 2 가 종료된 시점에는 두번째로 제일 큰 원소가 맨 뒤에 위치하게 됩니다.

![Pasted image 20250212150956](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250212150956.png)


### Round 3

Round 3 정렬 프로세스입니다. Index 0 ~ (N - 2) 순서대로, 인접한 원소와 값을 비교하고 결과에 따라 값을 Swap 해줍니다.

1. Index 0 과 Index 1 을 비교합니다. Index 1 의 값이 더 작으니 `Index 0 과 값을 Swap` 합니다.
2. Index 1 과 Index 2 를 비교합니다. Index 2 의 값이 더 작으니 `Index 1 과 값을 Swap` 합니다.
3. Index 2 와 Index 3 을 비교합니다. Index 2 의 값이 더 작으니 `값을 Swap 하지 않습니다`.
4. Index 3 과 Index 4 를 비교합니다. Index 3 의 값이 더 작으니 `값을 Swap 하지 않습니다`.

> Round 3 이 종료된 시점에는 세번째로 제일 큰 원소가 맨 뒤에 위치하게 됩니다.

![Pasted image 20250212151016](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250212151016.png)


### Round 4

Round 4 정렬 프로세스입니다. Index 0 ~ (N - 2) 순서대로, 인접한 원소와 값을 비교하고 결과에 따라 값을 Swap 해줍니다.

1. Index 0 과 Index 1 을 비교합니다. Index 0 의 값이 더 작으니 `값을 Swap 하지 않습니다`.
2. Index 1 과 Index 2 를 비교합니다. Index 1 의 값이 더 작으니 `값을 Swap 하지 않습니다`.
3. Index 2 와 Index 3 을 비교합니다. Index 2 의 값이 더 작으니 `값을 Swap 하지 않습니다`.
4. Index 3 과 Index 4 를 비교합니다. Index 3 의 값이 더 작으니 `값을 Swap 하지 않습니다`.

> Round 4 이 종료된 시점에는 네번째로 제일 큰 원소가 맨 뒤에 위치하게 됩니다.

![Pasted image 20250212151031](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250212151031.png)

### End

4개의 Round 가 모두 끝났으니 정렬 과정이 종료됩니다. 

![Pasted image 20250212152528](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250212152528.png)

## Code

오름차순을 기준으로 한 최적화 수행 전 코드입니다. 각 Round 마다 비교 횟수가 줄으며 값을 Swap 해 나갑니다.

> 하지만 현재 코드는 모든 Round 가 수행되기 전, 이미 모두 정렬이 되어도 Round 가 끝날때까지 계속 비교연산을 한다는 단점이 있습니다.

```python
def bubble_sort1(arr):  
    """ 최적화 전 """    
5. N = len(arr)  
    for idx in range(N - 1, 0, -1): # idx 는 round 와 동일합니다.  
        for jdx in range(idx):  
            if arr[jdx + 1] < arr[jdx]:  
                arr[jdx + 1], arr[jdx] = arr[jdx], arr[jdx + 1]  
  
    return arr
```


최적화 코드입니다. 다음 Round 를 수행될지 말지에 대한 여부를 확인할 수 있는 Flag 변수를 두어, 불필요한 비교연산을 줄일 수 있습니다.

```python
def bubble_sort2(arr):  
    """ 최적화 후 """    
	N = len(arr)  
    for idx in range(N - 1, 0, -1):  
        flag = False  
        for jdx in range(idx):  
            if arr[jdx + 1] < arr[jdx]:  
                arr[jdx + 1], arr[jdx] = arr[jdx], arr[jdx + 1]  
                flag = True  
        if not flag:  
            break  
  
    return arr
```


## 장단점

**장점**

1. 구현이 간단하고 직관적입니다
2. 제자리 정렬 (In-Place Sorting) 알고리즘 중 하나이기 때문에 추가적인 메모리 공간을 거의 사용하지 않습니다.
3. `최적화된 코드를 사용하게 되면`, 데이터가 이미 거의 정렬된 상태일 경우, `O(N)` 의 시간 복잡도로 단축이 가능합니다.

**단점**

1. 평균, 최악의 경우 `O(N²)` 의 시간 복잡도를 갖기 때문에 정렬하고자 하는 원소의 개수가 많아질수록 성능이 저하됩니다.
2. 동일한 값을 가지는 원소들의 상대적인 순서가 변경될 수 있는 `불안정 정렬(Unstable Sort)` 입니다.
3. 많은 Swap 이 발생하게 되어 대규모 데이터나 성능이 중요한 경우에는 `퀵 정렬(Quick Sort)` 이나 `합병 정렬(Merge Sort)` 과 같이 효율적인 정렬 알고리즘을 사용해야 합니다.
4. `최적화된 코드를 사용하지 않으면` 데이터가 이미 정렬되어 있더라도, 여전히 매번 비교 작업을 수행하므로 `O(N²)` 의 시간 복잡도를 갖습니다.

## Reference

- [제자리 정렬](https://lifework-archive-reservoir.tistory.com/365)
- [안정 정렬 & 불안정 정렬](https://velog.io/@good159897/%EC%95%88%EC%A0%95-%EC%A0%95%EB%A0%AC-VS-%EB%B6%88%EC%95%88%EC%A0%95-%EC%A0%95%EB%A0%AC-%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98-%EC%9D%B8%ED%84%B0%EB%B7%B0)
- [버블 정렬 시간복잡도](https://www.daleseo.com/sort-bubble/)
- [버블 정렬](https://gmlwjd9405.github.io/2018/05/06/algorithm-bubble-sort.html)
