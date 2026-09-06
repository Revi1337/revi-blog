---
title: BinarySearch (이분 탐색)
date: 2026-07-21
updated_at: 2026-07-28
tags:
  - algorithm
  - binary_search
  - concept
description: 정렬된 배열에서 시간 복잡도 O(log N)으로 특정 값을 탐색하는 이분 탐색, Lower Bound, Upper Bound 알고리즘
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/BinarySearch-thumbnail.jpg
audio:
  - https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/media/2026-09-06/BinarySearch-script.mp3
---

## Binary Search

`Binary Search(이분 탐색)`는 정렬된 배열이나 수의 범위에서 특정 값을 효율적으로 찾기 위한 알고리즘입니다. 중간 값을 기준으로 원하는 값이 왼쪽 구간에 있는지, 오른쪽 구간에 있는지를 판단하여 탐색 범위를 절반씩 줄여나가는 방식으로 동작합니다.

- 탐색 범위를 매번 절반으로 줄이므로 시간 복잡도는 `O(log N)`으로 매우 효율적입니다.

> 이분 탐색은 일반 이분탐색, Lower Bound, Upper Bound 로 나눌 수 있습니다.


## Mechanism

가장 기본적인 이분 탐색은 정렬된 배열에서 특정 값을 정확히 찾는 경우에 사용됩니다. 그 동작 과정은 다음과 같습니다.

1. 시작 인덱스 `left`와 끝 인덱스 `right`를 설정합니다. (left = 0, right = len(arr) - 1)
2. 중간 지점 `mid = (left + right) // 2`를 계산합니다.
3. `arr[mid]` 값과 찾고자 하는 값 `target`을 비교하여 탐색 범위를 절반으로 줄입니다.
    - `target == arr[mid]`인 경우: 값을 찾았으므로 `mid`를 반환합니다.
    - `target < arr[mid]`인 경우: 탐색 대상이 왼쪽 구간에 있으므로 `right = mid - 1`로 이동합니다.
    - `target > arr[mid]`인 경우: 탐색 대상이 오른쪽 구간에 있으므로 `left = mid + 1`로 이동합니다.
4. 2,3 과정을 `left <= right` 조건을 만족하는 동안 반복합니다.

> [!question] left <= right 동안 반복하는 이유
> 이분 탐색을 진행하다보면, 탐색 대상의 크기가 점점 줄어들며 left == right이 되는 순간이 있습니다. 이 경우에도 mid 에 위치한 값이 target 과 일치하는지 확인하는 기회가 꼭 필요하기 때문입니다.

> [!question] left & right 포인터가 mid +1 또는 mid - 1 로 움직이는 이유
> 다음 left & right 포인터는 이전 mid 에 위치한 데이터가 정답의 후보가 될 수 있었냐 없었냐 여부를 기준으로 움직이게 됩니다. 현재 mid 에 위치한 값이 정답의 후보가 될 수 없으면, 다음 탐색 범위에서 제외시키기 위해 mid 기준 +1 또는 -1로 움직이게 됩니다.

<br>

정렬된 데이터를 기반으로 BinarySearch(5)를 구해보겠습니다. 가장 먼저 left, right 를 각각 0, 7로 설정합니다.

1. 중간 지점을 계산합니다. `(left + right) // 2 = 3`
	- 탐색 대상 5가 중간 지점 값 6보다 왼쪽에 있으므로 `right = mid - 1`하여 탐색 범위를 탐색 범위를 왼쪽 절반으로 줄입니다.
2. 다시 중간 지점을 계산합니다.
	- 탐색 대상 5가 중간 지점 값 4보다 오른쪽에 있으므로 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
3. 다시 중간 지점을 계산합니다.
	- 탐색 대상 5가 중간 지점 값과 같으므로 `mid` 를 반환하고 탐색을 종료합니다.

![Pasted image 20250724014323](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250724014323.png)


이번에는 BinarySearch(14)를 구해보겠습니다. 가장 먼저 left, right 를 각각 0, 7로 설정합니다.

1. 중간 지점을 계산합니다. `(left + right) // 2 = 3`
	- 탐색 대상 14가 중간 지점 값 6보다 오른쪽에 있으므로 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
2. 다시 중간 지점을 계산합니다.
	- 탐색 대상 14가 중간 지점 값 12보다 오른쪽에 있으므로 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
3. 다시 중간 지점을 계산합니다.
	- 탐색 대상 14가 중간 지점 값과 같으므로 `mid` 를 반환하고 탐색을 종료합니다.

![Pasted image 20250724123903](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250724123903.png)


이번에는 BinarySearch(11)를 구해보겠습니다. 가장 먼저 left, right 를 각각 0, 7로 설정합니다.

1. 중간 지점을 계산합니다. `(left + right) // 2 = 3`
	- 탐색 대상 11이 중간 지점 값 6보다 오른쪽에 있으므로 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
2. 다시 중간 지점을 계산합니다.
	- 탐색 대상 11이 중간 지점 값 12보다 왼쪽에 있으므로 `right = mid - 1`하여 탐색 범위를 왼쪽 절반으로 줄입니다.
3. 다시 중간 지점을 계산합니다.
	- 탐색 대상 11이 중간 지점 값 10보다 오른쪽으로 있으므로 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
	- `left < right` 가 되었으므로 탐색이 종료됩니다. 하지만, 이전에 mid 값을 리턴한 적이 없으므로, 찾을 수 없었다는 의미로 -1 를 반환합니다.

![Pasted image 20250724125032](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250724125032.png)


## Lower Bound

Lower Bound Search는 `찾고자 하는 값보다 크거나 같은 값 중`에서 가장 작은 값의 위치를 반환하는 이분 탐색 방법입니다. 즉, `target <= arr[i]` 를 만족하는 최소 인덱스를 구할 수 있습니다.

1. 시작 인덱스 `left`와 끝 인덱스 `right`를 설정합니다. 이때 `right = len(arr)`로 설정합니다.
2. 중간 지점 `mid = (left + right) // 2`를 계산합니다.
3. `arr[mid]`와 `target`을 비교해 탐색 범위를 반으로 줄입니다.
    - `target <= arr[mid]`인 경우: mid는 정답 후보일 수 있으므로 `right = mid`로 이동합니다.
    - `target > arr[mid]`인 경우: mid는 정답이 될 수 없으므로 `left = mid + 1`로 이동합니다.
4. 2,3 과정을 `left < right`인 동안 반복합니다.
5. 반복 종료 시 `left` 또는 `right`가 Lower Bound 결과를 가리킵니다.

> [!question] left < right 동안 반복하는 이유
> Lower Bound는 탐색 중간에 값을 리턴하지 않기 때문에, left == right인 상태가 반드시 발생합니다. 만약 반복 조건을 left <= right 로 설정하게 된다면 left/mid/right 포인터가 계속 같은 위치로 반복되는 무한루프 상황이 발생하게 됩니다. 따라서 반복 조건을 left < right 로 설정합니다.

> [!question] right = mid가 되는 이유
> 현재 `arr[mid]`가 조건을 만족한다면, 정답일 가능성이 있으므로 mid를 버리지 않고 탐색 범위에 포함시켜야 합니다. 따라서 right = mid가 됩니다. 반대로 `arr[mid]`가 조건을 만족하지 않으면 mid + 1부터 탐색하므로 left = mid + 1이 됩니다.

> [!question] 초기 right = len(arr)로 설정하는 이유
> Lower Bound는 찾으려는 값이 존재하지 않아도, 그 값이 정렬을 유지하며 들어갈 수 있는 위치를 반환해야 합니다. 예를 들어 `[1, 3, 3, 6, 7]`에서 lower_bound(5)는 값 6의 인덱스 3을 반환합니다. 반면 lower_bound(10)은 배열에 10 이상 값이 없으므로 삽입 위치인 5를 반환해야 합니다. 이를 위해 right = len(arr)로 설정해, 배열 마지막 이후의 위치까지 고려하게 됩니다.

<br>

정렬된 데이터를 기반으로 LowerBound(11)를 구해보겠습니다. 가장 먼저 left, right 를 각각 0, 8로 설정합니다.

1. 중간 지점을 계산합니다. `(left + right) // 2 = 4`
	- 중간 값 10은 탐색 대상 11보다 작으므로 정답 후보가 될 수 없습니다. 이는 정답 후보들이 최소한 mid보다 오른쪽 있다는 것을 의미합니다. 따라서 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
2. 다시 중간 지점을 계산합니다.
	- 중간 값 14는 탐색 대상 11보다 크므로 정답 후보가 될 수 있습니다. 이는 정답 후보들이 mid를 포함한 왼쪽에 있다는 것을 의미합니다. 따라서 `rigt = mid`하여 탐색 범위를 mid를 포함한 왼쪽 절반으로 줄입니다.
3. 다시 중간 지점을 계산합니다.
	- 중간 값 12는 탐색 대상 11보다 크므로 정답 후보가 될 수 있습니다. 동일한 이유로 `rigt = mid`하여 탐색 범위를 mid를 포함한 왼쪽 절반으로 줄입니다.
4. left < right 를 만족하지 못하기 때문에 탐색을 종료하고 left 또는 right 포인터를 반환합니다.
	- LowerBound(11)의 값은 5번 인덱스가 됩니다.

![Pasted image 20250724142955](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250724142955.png)


이번에는 LowerBound(3)를 구해보겠습니다. 가장 먼저 left, right 를 각각 0, 8로 설정합니다.

1. 중간 지점을 계산합니다. `(left + right) // 2 = 4`
	- 중간 값 10은 탐색 대상 3보다 크므로 정답 후보가 될 수 있습니다. 이는 정답 후보들이 mid를 포함한 왼쪽에 있다는 것을 의미합니다. 따라서 `rigt = mid`하여 탐색 범위를 mid를 포함한 왼쪽 절반으로 줄입니다.
2. 다시 중간 지점을 계산합니다.
	- 중간 값 5는 탐색 대상 3보다 크므로 정답 후보가 될 수 있습니다. 동일한 이유로 `rigt = mid`하여 탐색 범위를 mid를 포함한 왼쪽 절반으로 줄입니다.
3. 다시 중간 지점을 계산합니다.
	- 중간 값 4는 탐색 대상 3보다 크므로 정답 후보가 될 수 있습니다. 동일한 이유로 `rigt = mid`하여 탐색 범위를 mid를 포함한 왼쪽 절반으로 줄입니다.
4. 다시 중간 지점을 계산합니다.
	- 중간 값 2는 탐색 대상 3보다 작으므로 정답 후보가 될 수 없습니다. 이는 정답 후보들이 최소한 mid보다 오른쪽 있다는 것을 의미합니다. 따라서 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
5. left < right 를 만족하지 못하기 때문에 탐색을 종료하고 left 또는 right 포인터를 반환합니다.
	- LowerBound(3)의 값은 1번 인덱스가 됩니다.

![Pasted image 20250724143431](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250724143431.png)


이번에는 LowerBound(100)를 구해보겠습니다. 가장 먼저 left, right 를 각각 0, 8로 설정합니다.

1. 중간 지점을 계산합니다. `(left + right) // 2 = 4`
	- 중간 값 10은 탐색 대상 100보다 작으므로 정답 후보가 될 수 없습니다. 이는 정답 후보들이 최소한 mid보다 오른쪽 있다는 것을 의미합니다. 따라서 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
2. 다시 중간 지점을 계산합니다.
	- 중간 값 14는 탐색 대상 100보다 작으므로 정답 후보가 될 수 없습니다. 동일한 이유로 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
3. 다시 중간 지점을 계산합니다.
	- 중간 값 16는 탐색 대상 100보다 작으므로 정답 후보가 될 수 없습니다. 동일한 이유로 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
4. left < right 를 만족하지 못하기 때문에 탐색을 종료하고 left 또는 right 포인터를 반환합니다.
	- LowerBound(100)의 값은 8번 인덱스가 됩니다.

![Pasted image 20250724145629](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250724145629.png)


## Upper Bound

Upper Bound Search는 `찾고자 하는 값보다 큰 값 중`에서 가장 작은 값의 위치를 반환하는 이분 탐색 방법입니다. 즉, `target < arr[i]`을 만족하는 최소 인덱스를 구할 수 있습니다.

1. 시작 인덱스 `left`와 끝 인덱스 `right`를 설정합니다. 이때 `right = len(arr)`로 설정합니다.
2. 중간 지점 `mid = (left + right) // 2`를 계산합니다.
3. `arr[mid]`와 `target`을 비교해 탐색 범위를 반으로 줄입니다.
    - `target < arr[mid]`인 경우: mid는 정답 후보일 수 있으므로 `right = mid`로 이동합니다.
    - `target >= arr[mid]`인 경우: mid는 정답이 될 수 없으므로 `left = mid + 1`로 이동합니다.
4. 2,3 과정을 `left < right`인 동안 반복합니다.
5. 반복 종료 시 `left` 또는 `right`가 Lower Bound 결과를 가리킵니다.

> left < right 동안 반복하는 이유, right = mid가 되는 이유, 초기 right = len(arr)로 설정하는 이유는 Lower Bound 와 동일합니다.

<br>

정렬된 데이터를 기반으로 UpperBound(10)을 구해보겠습니다. 가장 먼저 left, right 를 각각 0, 8로 설정합니다.

1. 중간 지점을 계산합니다. `(left + right) // 2 = 4`
	- 중간 값 10은 탐색 대상 10보다 크지 않으므로 정답 후보가 될 수 없습니다. 이는 정답 후보들이 최소한 mid보다 오른쪽 있다는 것을 의미합니다. 따라서 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
2. 다시 중간 지점을 계산합니다.
	- 중간 값 14는 10보다 크므로 정답 후보가 될 수 있습니다. 따라서 정답 후보들은 mid 를 포함한 왼쪽에 있다는 것을 알 수 있습니다. 따라서 `right = mid`하여 탐색 범위를 mid를 포함한 왼쪽 절반으로 줄입니다.
3. 다시 중간 지점을 계산합니다.
	- 중간 값 12는 10보다 크므로 정답이 될 수 있습니다. 동일한 이유로 `right = mid`하여 탐색 범위를 mid를 포함한 왼쪽 절반으로 줄입니다.
4. left < right 를 만족하지 못하기 때문에 탐색을 종료하고 left 또는 right 포인터를 반환합니다.
	- UpperBound(11)의 값은 5번 인덱스가 됩니다.

![Pasted image 20250724155552](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250724155552.png)


이번에는 UpperBound(9)로 구해보겠습니다. 가장 먼저 left, right 를 각각 0, 8로 설정합니다.

1. 중간 지점을 계산합니다. `(left + right) // 2 = 4`
	- 중간 값 10은 9보다 크므로 정답 후보가 될 수 있습니다. `right = mid` 하여 탐색 범위를 mid를 포함한 왼쪽 절반으로 줄입니다.
2. 다시 중간 지점을 계산합니다.
	- 중간 값 5는 9보다 작으므로 정답 후보가 될 수 없습니다. 이는 정답 후보들이 최소한 mid보다 오른쪽 있다는 것을 의미합니다. 따라서 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
3. 다시 중간 지점을 계산합니다.
	- 중간 값 6은 9보다 작으므로 정답 후보가 될 수 없습니다. 동일한 이유로 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
4. left < right 를 만족하지 못하기 때문에 탐색을 종료하고 left 또는 right 포인터를 반환합니다.
	- UpperBound(9)의 값은 4번 인덱스가 됩니다.

![Pasted image 20250724154457](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250724154457.png)


이번에는 UpperBound(100)로 구해보겠습니다. 가장 먼저 left, right 를 각각 0, 8로 설정합니다.

1. 중간 지점을 계산합니다. `(left + right) // 2 = 4`
	- 중간 값 10은 100보다 작으므로 정답 후보가 될 수 없습니다. 이는 정답 후보들이 최소한 mid보다 오른쪽 있다는 것을 의미합니다. 따라서 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
2. 다시 중간 지점을 계산합니다.
	- 중간 값 14는 100보다 작으므로 정답이 될 수 없습니다. 동일한 이유로 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
3. 다시 중간 지점을 계산합니다.
	- 중간 값 16은 100보다 작으므로 정답이 될 수 없습니다. 동일한 이유로 `left = mid + 1`하여 탐색 범위를 오른쪽 절반으로 줄입니다.
4. left < right 를 만족하지 못하기 때문에 탐색을 종료하고 left 또는 right 포인터를 반환합니다.
	- UpperBound(100)의 값은 8번 인덱스가 됩니다.

![Pasted image 20250724154903](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250724154903.png)


## Implementation

```python
def binary_search(arr, target):  
    arr.sort()  
    left, right = 0, len(arr) - 1  
    while left <= right:  
        mid = (left + right) // 2  
        if arr[mid] == target:  
            return mid  
  
        if arr[mid] < target:  
            left = mid + 1      # mid 를 포함하지 않은 오른쪽 절반을 탐색.  
        else:  
            right = mid - 1     # mid 를 포함하지 않은 왼쪽 절반을 탐색.  
  
    return -1  
  
arr = [6, 16, 2, 10, 4, 5, 12, 14]  
print(binary_search(arr, 5))  
print(binary_search(arr, 14))  
print(binary_search(arr, 11))  
  
  
def lower_bound(arr, target):  
    arr.sort()  
    left, right = 0, len(arr)  
    while left < right:  
        mid = (left + right) // 2  
        if arr[mid] >= target:  # 정답 후보가 될 수 있으면(target이 arr[mid]보다 크거나 같으면)  
            right = mid         # mid 를 포함한 왼쪽 절반을 탐색.  
        else:  
            left = mid + 1      # mid 를 포함하지 않은 왼쪽 절반을 탐색.  
  
    return -1 if right == len(arr) else arr[right]  
  
arr = [2,4,5,6,10,12,14,16]  
print(lower_bound(arr, 11))  
print(lower_bound(arr, 3))  
print(lower_bound(arr, 100))  
  
  
def upper_bound(arr, target):  
    arr.sort()  
    left, right = 0, len(arr)  
    while left < right:  
        mid = (left + right) // 2  
        if arr[mid] > target:   # 정답 후보가 될 수 있으면(target이 arr[mid]보다 크면)  
            right = mid         # mid 를 포함한 왼쪽 절반을 탐색.  
        else:  
            left = mid + 1      # mid 를 포함하지 않은 왼쪽 절반을 탐색.  
  
    return -1 if right == len(arr) else arr[right]  
  
arr = [2,4,5,6,10,12,14,16]  
print(upper_bound(arr, 10))  
print(upper_bound(arr, 9))  
print(upper_bound(arr, 100))
```
