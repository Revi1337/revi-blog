---
title: InsertionSort (삽입 정렬)
date: 2026-07-16
updated_at: 2026-07-28
tags:
  - algorithm
  - sort
  - concept
description: 정렬된 영역에 현재 원소를 적절한 위치에 삽입하는 제자리 정렬 알고리즘인 삽입 정렬의 개념과 구현
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/InsertionSort-thumbnail.jpg
audio:
  - https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/media/2026-09-06/InsertionSort-script.mp3
---

## Insertion Sort

삽입 정렬(Insertion Sort) 은 `제자리 정렬(In-Place Sorting) 알고리즘` 중 하나입니다. 삽입 정렬은 각 `라운드(Round)`마다 현재 원소를 `자신보다 앞에 있는 정렬된 원소`들 중 `가장 알맞은 위치에 삽입하는 방식`으로 동작합니다.

삽입정렬에서 말하는 "가장 알맞은 위치" 란

- 오름차순 기준 : `현재 원소보다 앞에 위치`해있고 `현재 원소보다 작은 값들 중`에서 `가장 마지막에 위치한 원소 뒤`입니다
- 내림차순 기준 : `현재 원소보다 앞에 위치`해있고 `현재 원소보다 큰 값들 중` 에서 `가장 마지막에 위치한 원소` 뒤입니다.

> [!note] 제자리 정렬(In-Place Sorting) 알고리즘
> 제자리 정렬은 추가적인 메모리 공간을 거의 사용하지 않고 원래 주어진 배열 또는 리스트 내에서 요소들을 정렬하는 알고리즘을 말합니다.

> [!note] Round(라운드)
> Round(라운드) 는 반복적인 정렬 알고리즘에서 한 번의 주요 연산이 진행되는 단계를 의미합니다. 즉, 한 Round 마다 배열의 특정 부분 혹은 일부가 정렬되게 됩니다. N 개의 원소를 정렬하려면 N - 1 개의 Round 가 필요합니다. 라운드는 주로 선택 정렬, 버블 정렬, 삽입 정렬 같은 알고리즘에서 사용됩니다. 

## Process

길이가 N 인 배열을 오름차순 정렬을 한다고 가정한다면 총 `N - 1` 라운드가 진행됩니다. 또한, 삽입 정렬은 `배열의 두번째 원소(Index 1)` 부터 탐색을 시작합니다. 각 라운드에서는 다음과 같은 과정이 이루어집니다. 

 1. Round 1 : 배열의 두 번째 원소(`Index 1`)와 왼쪽에 있는 첫 번째 원소(`Index 0`)를 **뒤에서부터 차례대로 비교**하여, `첫 번째로 자신보다 작은 원소 뒤에 현재 원소를 삽입`하고 종료합니다.
 2. Round 2 : 배열의 세 번째 원소(`Index 2`)와 왼쪽에 있는 값들(`Index 0, 1`)을 **뒤에서부터 차례대로 비교**하여, `첫 번째로 자신보다 작은 값 뒤에 현재 원소를 삽입`하고 종료합니다.
 3. Round 3 : 배열의 네 번째 원소(`Index 3`)와 왼쪽에 있는 값들(`Index 0, 1, 2`)을 **뒤에서부터 차례대로 비교**하여, `첫 번째로 자신보다 작은 값 뒤에 현재 원소를 삽입`하고 종료합니다.
 4. ...
 5. Round N - 1: 배열의 N-1 번째 원소(`Index N-1`)와 왼쪽에 있는 값들(`Index 0, 1, 2, ..., N-2`)을 **뒤에서부터 차례대로 비교**하여, `첫 번째로 자신보다 작은 값 뒤에 현재 원소를 삽입`하고 종료합니다.


말로면 설명하면 이해하기 어려울 수 있기 때문에, 길이가 5인 1차원 배열 `[8,5,6,2,4]` 을 오름차순하는 예시를 한번 살펴보겠습니다. 길이가 5 인 배열이니 총 4 개의 Round 가 동작하게 됩니다.

### Round 1

Round 1 은 현재 원소 `Index 1` 과 왼쪽 원소 `Index 0` 를 비교합니다. 

- Index 0 값이 더 크기 때문에 더 `Index 0 - 1`  과 이어서 비교합니다.
- 하지만 Index 0 보다 더 작을 순 없기 때문에, `Index 0 에 원소를 삽입`하고 종료합니다.
- 정렬된 상태: `[5, 8, 6, 2, 4]`

![Pasted image 20250212014201](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250212014201.png)

### Round 2

Round 2 는 현재 원소 `Index 2` 과 왼쪽 원소 `Index 0,1` 를 뒤에서부터 차례대로 비교합니다.

- Index 1 값이 더 크기 때문에 더 `Index 0` 과 이어서 비교합니다.
- Index 0 값이 현재 원소 Index 2 보다 작기 때문에, `Index 0 뒤인 Index 1`  에 현재 원소를 삽입하고 종료합니다.
- 정렬된 상태: `[5, 6, 8, 2, 4]`

![Pasted image 20250212014946](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250212014946.png)

### Round 3

Round 3 는 현재 원소 `Index 3` 과 왼쪽 원소 `Index 0,1,2` 를 뒤에서부터 차례대로 비교합니다.

- Index 2 값이 더 크기 때문에 더 `Index 1` 과 이어서 비교합니다.
- Index 1 값이 더 크기 때문에 더 `Index 0` 과 이어서 비교합니다.
- Index 0 값이 더 크기 때문에 더 `Index 0 - 1` 과 이어서 비교합니다.
- 하지만 Index 0 보다 더 작을 순 없기 때문에, `Index 0 에 원소를 삽입`하고 종료합니다.
- 정렬된 상태: `[2, 5, 6, 8, 4]`

![Pasted image 20250212015818](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250212015818.png)

### Round 4

Round 4 는 현재 원소 `Index 4` 과 왼쪽 원소 `Index 0,1,2,3` 를 뒤에서부터 차례대로 비교합니다.

- Index 3 값이 더 크기 때문에 더 `Index 2` 과 이어서 비교합니다.
- Index 2 값이 더 크기 때문에 더 `Index 1` 과 이어서 비교합니다.
- Index 1 값이 더 크기 때문에 더 `Index 0` 과 이어서 비교합니다.
- Index 0 값이 현재 원소 Index 2 보다 작기 때문에, `Index 0 뒤인 Index 1`  에 현재 원소를 삽입하고 종료합니다.
- 정렬된 상태: `[2, 4, 5, 6, 8]`

![Pasted image 20250212015831](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250212015831.png)

### End

4개의 Round 가 모두 끝났으니 정렬 과정이 종료됩니다. 

![Pasted image 20250212020004](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250212020004.png)

## Code

오름차순을 기준으로 한 최적화 전 코드입니다. 기본적으로 `arr[index - 1]` 값이 `arr[index]` 값 보다 크면, 두 값을 Swap 하는 방식으로 삽입정렬을 구현할 수 있습니다.

> 하지만 현재 코드는 불필요한 비교 연산을 계속한다는 단점이 있습니다.

```python
def insertion_sort(arr):  
	""" 최적화 전 """
    N = len(arr)  
    for end in range(1, N):  
        for idx in range(end, 0, -1):  
            if arr[idx - 1] > arr[idx]:  
                arr[idx], arr[idx - 1] = arr[idx - 1], arr[idx]  
                
    return arr
```


첫번째 최적화 코드입니다. 이미 Swap 을 진행했으면 Round 를 종료시킵니다. 왜냐하면 값을 Swap 한 시점에서 현재 Index 보다 앞에 있는 원소들은 이미 오름차순 정렬되어 있을 것이기 때문입니다. 

```python
def insertion_sort(arr):  
	""" 불필요한 비교를 하지 않도록 최적화 """
    N = len(arr)  
    for end in range(1, N):  
        for idx in range(end, 0, -1):  
            if arr[idx - 1] > arr[idx]:  
                arr[idx], arr[idx - 1] = arr[idx - 1], arr[idx]  
            else:  
                break  
                
	return arr
```


마지막 최적화 코드입니다. 단순히 코드 가독성을 위해 for 문을 줄이고 While 문으로 대체할 수 있습니다.

```python
def insertion_sort(arr):  
	""" 가독성을 위한 최적화 """
    N = len(arr)  
    for end in range(1, N):  
        idx = end  
        while idx > 0 and arr[idx - 1] > arr[idx]:  
            arr[idx - 1], arr[idx] = arr[idx], arr[idx - 1]  
            idx -= 1  
  
    return arr
```

## 장단점

**장점**

1. 구현이 간단하고 직관적입니다
2. 제자리 정렬 (In-Place Sorting) 알고리즘 중 하나이기 때문에 추가적인 메모리 공간을 거의 사용하지 않습니다.
3. 데이터가 이미 거의 정렬된 상태일 경우, `O(N)` 의 시간 복잡도로 단축이 가능합니다.
4. 정렬하고자하는 원소 개수가 적을 경우 매우 빠르게 동작하여, 다른 정렬 알고리즘보다 우수할 수 있습니다.

**단점**

1. 평균, 최악의 경우 `O(N²)` 의 시간 복잡도를 갖기 때문에 정렬하고자 하는 원소의 개수가 많아질수록 성능이 저하됩니다.
2. 동일한 값을 가지는 원소들의 상대적인 순서가 변경될 수 있는 `불안정 정렬(Unstable Sort)` 입니다.
3. `최적화된 코드를 사용하지 않으면` 데이터가 이미 정렬되어 있더라도, 여전히 매번 비교 작업을 수행하므로 `O(N²)` 의 시간 복잡도를 갖습니다.

## Reference

- [제자리 정렬](https://lifework-archive-reservoir.tistory.com/365)
- [안정 정렬 & 불안정 정렬](https://velog.io/@good159897/%EC%95%88%EC%A0%95-%EC%A0%95%EB%A0%AC-VS-%EB%B6%88%EC%95%88%EC%A0%95-%EC%A0%95%EB%A0%AC-%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98-%EC%9D%B8%ED%84%B0%EB%B7%B0)
- [삽입 정렬 시간복잡도](https://www.daleseo.com/sort-insertion/)
- [삽입 정렬](https://gmlwjd9405.github.io/2018/05/06/algorithm-insertion-sort.html)
