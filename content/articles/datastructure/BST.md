---
title: BST
date: 2026-07-06
updated_at: 2026-09-06 19:55
tags:
  - datastructure
  - bst
  - tree
  - concept
description: 왼쪽 자식 < 부모 < 오른쪽 자식 정렬 규칙을 만족하는 이진 탐색 트리(BST)의 개념과 특성
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/BST-thumbnail.jpg
audio:
  - https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/media/2026-09-06/BST-script.mp3
---

## Binary Search Tree (BST)

Binary Search Tree(BST: 이진 탐색 트리)는 이진 트리의 한 종류로, 데이터를 정렬된 상태로 저장하고, 이를 기반으로 빠르게 데이터를 탐색하기 위해 설계된 `비선형 자료구조`입니다. 일반적인 이진 트리와 달리, BST는 `모든 노드가 정렬 규칙을 만족해야 한다`는 구조적 특징을 가집니다. 대표적으로 Java의 `TreeMap`과 `TreeSet`이 내부적으로 Red-Black Tree(균형 BST)를 사용합니다.

- 모든 노드에 대해 `왼쪽 서브트리의 모든 값 < 부모 노드 < 오른쪽 서브트리의 모든 값` 규칙이 모든 하위 트리(SubTree)에 대해 재귀적으로 적용됩니다.
- 입력된 순서가 보존되지 않기 때문에, `i번째 데이터 접근`과 같은 연산은 존재하지 않습니다.
- BST에 삽입되는 원소의 순서에 따라 트리 구조가 달라질 수 있으며, 이는 시간복잡도에 영향을 미칩니다.
- 트리가 `균형잡혀 있을 경우` 다음과 같은 시간복잡도를 가집니다.
	- 데이터의 삽입/삭제/탐색에 평균 `O(log N)` 시간복잡도를 가집니다.
	- X 기준 Ceiling & Floor 연산에 `O(log N)` 시간복잡도를 가집니다.

> 트리가 한쪽으로 치우칠 경우 삽입/삭제/탐색의 시간복잡도는 O(N)까지 나빠질 수 있습니다. 따라서 트리를 균형있게 유지하기 위해 BST의 한 종류인 Red-Black Tree 같은 균형 BST 를 사용합니다.

> [!note] Ceiling & Floor
> - Ceiling : 트리 내에서 X 이상인 값 중 가장 작은 값을 말합니다.
> - Floor : 트리 내에서 X 이하인 값 중 가장 큰 값을 말합니다.

![Pasted image 20250611033553](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250611033553.png)


## Operation

이진 탐색 트리(BST) 의 주요 연산은 다섯 가지가 있습니다. 각 연산의 시간복잡도는 다음과 같습니다.

| Operation  | Average Time | Worst Time | Description               |
| :--------: | :-----------: | :--------: | ------------------------- |
| 삽입(Insert) |   O(log N)    |    O(N)    | 데이터를 트리에 삽입               |
| 탐색(Search) |   O(log N)    |    O(N)    | 데이터가 트리에 있는지 탐색           |
| 삭제(Delete) |   O(log N)    |    O(N)    | 트리에서 특정 데이터을 삭제           |
|    Ceil    |   O(log N)    |    O(N)    | 트리 내 X 이상인 값 중 가장 작은 값 탐색 |
|   Floor    |   O(log N)    |    O(N)    | 트리 내 X 이하인 값 중 가장 큰 값 탐색  |

### Insert

삽입(Insert)은 데이터를 BST에 추가하는 연산입니다. 동작 과정은 다음과 같습니다.

1. 루트 노드가 비어 있다면, 삽입할 값을 루트 노드로 설정하고 연산을 종료합니다.
2. 루트 노드를 현재 노드로 설정합니다.
3. 현재 노드의 값과 삽입할 값을 비교합니다.
	- 삽입할 값이 현재 노드보다 작다면 왼쪽 자식 노드로 이동합니다.
		- 즉, 현재 노드를 왼쪽 자식 노드로 갱신합니다.
		- 만약 왼쪽 자식 노드가 없다면, 해당 위치에 값을 삽입하고 종료합니다.
	- 삽입할 값이 현재 노드보다 크다면 오른쪽 자식 노드로 이동합니다.
		- 즉, 현재 노드를 오른쪽 자식 노드로 갱신합니다.
		- 만약 오른쪽 자식 노드가 없다면, 해당 위치에 값을 삽입하고 종료합니다.
4. 3번 과정을 삽입이 완료될 때까지 반복합니다.



예를 들어 `24`라는 데이터를 BST에 삽입하면 다음과 같은 순서로 진행됩니다.

1. 루트 노드에 `20`이 있으므로, `24`와 비교합니다.  
	- `24 > 20` 이므로 오른쪽 자식 노드로 이동합니다.
2. 현재 노드에는 `25`가 있으므로, `24`와 비교합니다.  
	- `24 < 25` 이므로 왼쪽 자식 노드로 이동합니다.
3. 현재 노드에는 `21`이 있으므로, `24`와 비교합니다.  
	- `24 > 21` 이므로 오른쪽 자식 노드로 이동합니다.
4. 해당 위치에 자식 노드가 없으므로, 여기에 `24`를 삽입하고 연산을 종료합니다.

![Pasted image 20250712003920](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250712003920.png)


동일한 원리로 `10`라는 데이터를 삽입할 수 있습니다.

![Pasted image 20250712004137](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250712004137.png)


### Search

탐색(Search)은 데이터가 트리에 있는지 탐색하는 연산입니다. 동작 과정은 다음과 같습니다.

1. 루트 노드를 현재 노드로 설정합니다.
2. 현재 노드의 값과 탐색할 값을 비교합니다.
	- 현재 노드의 값이 탐색할 값과 같다면, `True`를 반환하고 탐색을 종료합니다.
	- 탐색할 값이 현재 노드보다 작다면 왼쪽 자식 노드로 이동합니다.
	- 탐색할 값이 현재 노드보다 크다면 오른쪽 자식 노드로 이동합니다.
3. 2번 과정을 값이 발견되거나 탐색할 노드가 없을 때까지 반복합니다.


예를 들어 `24`라는 데이터를 BST에서 찾으려면 다음과 같은 순서로 진행됩니다.

1. 루트 노드에 `20`이 있으므로, `24`와 비교합니다.  
	- `24 > 20` 이므로 오른쪽 자식 노드로 이동합니다.
2. 현재 노드에는 `25`가 있으므로, `24`와 비교합니다.  
	- `24 < 25` 이므로 왼쪽 자식 노드로 이동합니다.
3. 현재 노드에는 `21`이 있으므로, `24`와 비교합니다.  
	- `24 > 21` 이므로 오른쪽 자식 노드로 이동합니다.
4. 오른쪽 자식의 데이터와 찾으려는 데이터가 같으므로 `True`를 반환하고 종료합니다.

![Pasted image 20250712004256](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250712004256.png)



BST에 없는 데이터를 찾으려 하면 `False`를 반환합니다. 예를 들어 `19`라는 데이터를 BST에서 찾으려면 다음과 같은 순서로 진행됩니다.

1. 루트 노드에 `20`이 있으므로, `19`와 비교합니다.
	- `19 < 20` 이므로 왼쪽 자식 노드로 이동합니다.
2. 현재 노드에는 `15`가 있으므로, `19`와 비교합니다.
	- `19 > 15` 이므로 오른쪽 자식 노드로 이동합니다.
3. 현재 노드에는 `17`이 있으므로, `19`와 비교합니다.
	- `19 > 17` 이므로 오른쪽 자식 노드로 이동해야 합니다.
	- 하지만 오른쪽 자식 노드가 없으므로, 더 이상 탐색할 노드가 없습니다. 따라서, 트리에 값이 존재하지 않음을 의미하므로 `False`를 반환하고 탐색을 종료합니다.

![Pasted image 20250712013651](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250712013651.png)


### Delete

삭제(Delete)는 데이터를 트리에서 제거하는 연산입니다. 삭제는 `삭제하려는 노드의 자식 수에 따라 세 가지 경우로 나뉩니다`.

1. 삭제하려는 노드에게 자식이 없는 경우
2. 삭제하려는 노드에게 자식이 하나 있는 경우
3. 삭제하려는 노드에게 자식이 모두 있는 경우


가장 먼저, 삭제하려는 노드를 찾습니다. 찾게되면, 위 세가지 경우로 나뉘게 됩니다.

1. `삭제하려는 노드에게 자식이 없는 경우`
	- 노드를 제거합니다.
2. `삭제하려는 노드에게 자식이 하나 있는 경우`
	- 삭제하려는 노드의 부모 노드가, 삭제하려는 노드 대신 그 자식 노드를 직접 가리키도록 연결합니다.
	- 즉, 삭제된 노드가 있던 위치(`left` 또는 `right`)에 자식 노드를 연결하여 트리 구조를 유지합니다.
3. `삭제하려는 노드에게 자식이 모두 있는 경우`
	- 삭제하려는 노드를 루트로 하는 서브트리 중 `왼쪽 서브트리에서 가장 큰 노드` 또는 `오른쪽 서브트리에서 가장 작은 노드`를 찾습니다.
		- 이 때, 찾아진 노드는 항상 자식이 최대 1개만 존재합니다.
	- 이후 다음과 같은 절차로 삭제를 진행합니다.
		1. 삭제하려는 노드의 값을 찾은 노드의 값으로 덮어씌웁니다.
		2. 찾은 노드를 삭제합니다.
			- 자식이 없으면 단순히 제거하고,
			- 자식이 하나 있다면 그 자식을 찾은 노드에 연결하여 대체합니다.


#### 노드에게 자식이 없는 경우

삭제하려는 노드에게 자식이 없는 경우 노드를 제거하고 종료합니다.

![Pasted image 20250713160213](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250713160213.png)


#### 노드에게 자식이 하나 있는 경우

삭제하려는 노드에게 자식이 하나 있는 경우, 삭제하려는 노드의 부모 노드가, 삭제하려는 노드 대신 그 자식 노드를 직접 가리키도록 연결합니다. 즉, 삭제된 노드가 있던 위치(`left` 또는 `right`)에 자식 노드를 연결하여 트리 구조를 유지합니다.

![Pasted image 20250713161043](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250713161043.png)


#### 노드에게 자식이 모두 있는 경우

삭제하려는 노드에게 자식이 모두 있는 경우, 해당 노드를 루트로 하는 서브트리 중 `왼쪽 서브트리에서 가장 큰 노드` 또는 `오른쪽 서브트리에서 가장 작은 노드`를 찾습니다. 

> 찾아진 노드는 항상 자식이 최대 1개만 존재합니다.

- 왼쪽 서브트리에서 찾아진 가장 큰 노드는 자식이 없거나 왼쪽 자식만 있을 수 밖에 없습니다.
	- 만약 오른쪽 자식이 있었다면, 서브트리에서 찾아진 가장 큰 노드가 그 노드가 됐었겠지요.
- 오른쪽 서브트리에서 찾아진 가장 작은 노드는 자식이 없거나 오른쪽 자식만 있을 수 밖에 없습니다.
	- 만약 왼쪽 자식이 있었다면, 서브트리에서 찾아진 가장 작은 노드가 그 노드가 됐었겠지요.

![Pasted image 20250713172331](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250713172331.png)


왼쪽에서 서브트리에서 찾아진 가장 큰 노드를 기반으로 삭제를 진행한다면, 가장 먼저 `삭제하려는 노드의 값을 찾은 노드의 값으로 덮어씌웁니다.

![Pasted image 20250713172431](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250713172431.png)


이후, 찾은 노드를 삭제합니다. 해당 노드에 왼쪽 자식이 없었다면 단순히 제거하고 종료합니다. 만약 왼쪽 자식이 있었다면, 그 자식을 찾은 노드에 연결 및 대체하고 종료합니다.

![Pasted image 20250713172517](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250713172517.png)


오른쪽 서브트리에서 찾아진 가장 작은 노드를 기반으로 삭제를 진행한다면, 가장 먼저 `삭제하려는 노드의 값을 찾은 노드의 값으로 덮어씌웁니다.

![Pasted image 20250713172553](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250713172553.png)


이후, 찾은 노드를 삭제합니다. 해당 노드에 오른쪽 자식이 없었다면 단순히 제거하고 종료합니다. 만약 오른쪽 자식이 있었다면, 그 자식을 찾은 노드에 연결 및 대체하고 종료합니다.

![Pasted image 20250713172619](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250713172619.png)


### Ceil

Ceil은 트리 내 X 이상인 값 중 가장 작은 값을 탐색하는 연산입니다. 동작 과정은 Search 연산과 비슷합니다.

1. 루트 노드를 현재 노드로 설정합니다.
2. 현재 노드의 값과 탐색할 값을 비교합니다.
	- 현재 노드의 값이 탐색할 값과 같다면, 해당 값을 반환하고 탐색을 종료합니다.
	- 탐색할 값이 현재 노드보다 작다면
		- 정답을 현재 노드값으로 갱신합니다.
		- 왼쪽 자식 노드로 이동합니다.
	- 탐색할 값이 현재 노드보다 크다면
		- 오른쪽 자식 노드로 이동합니다.
3. 2번 과정을 값이 발견되거나 탐색할 노드가 없을 때까지 반복합니다.

> 요약하면, 탐색 도중 현재 노드의 값이 X와 같다면 즉시 해당 값을 반환합니다. 그렇지 않다면, X가 현재 노드보다 작을 때마다 현재 노드의 값을 정답 후보로 갱신하고, 탐색 종료 시 마지막으로 갱신된 값을 반환하게 됩니다.


아래 BST에서 `Ceil(18)` 예시를 보겠습니다.

![Pasted image 20250714021951](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250714021951.png)


현재노드(20) > 18 이기 때문에, Ceil(18)의 값을 현재 노드 값 20으로 갱신하고 왼쪽 노드로 이동합니다.

![Pasted image 20250714022126](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250714022126.png)


현재노드(15) < 18 이기 때문에, 오른쪽 노드로 이동합니다.

![Pasted image 20250714022143](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250714022143.png)


현재노드(17) < 18 이기 때문에, 오른쪽 노드로 이동합니다.

![Pasted image 20250714022204](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250714022204.png)


현재노드(19) > 18 이기 때문에 Ceil(18)의 값을 현재 노드 값 20으로 갱신합니다. 하지만 더 이상 탐색할 노드가 없으므로 연산으로 종료합니다. 따라서 Ceil(18)의 값은 19가 됩니다.

![Pasted image 20250714022232](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250714022232.png)


### Floor

Floor는 트리 내 X 이하인 값 중 가장 큰 값을 탐색하는 연산입니다. 동작 과정은 Ceil 연산과 비슷합니다.

1. 루트 노드를 현재 노드로 설정합니다.
2. 현재 노드의 값과 탐색할 값을 비교합니다.
	- 현재 노드의 값이 탐색할 값과 같다면, 해당 값을 반환하고 탐색을 종료합니다.
	- 탐색할 값이 현재 노드보다 크다면
		- 정답을 현재 노드값으로 갱신합니다.
		- 오른쪽 자식 노드로 이동합니다.
	- 탐색할 값이 현재 노드보다 작다면
		- 왼쪽 자식 노드로 이동합니다.
3. 2번 과정을 값이 발견되거나 탐색할 노드가 없을 때까지 반복합니다.

> 요약하면, 탐색 도중 현재 노드의 값이 X와 같다면 즉시 해당 값을 반환합니다. 그렇지 않다면, X가 현재 노드보다 클 때마다 현재 노드의 값을 정답 후보로 갱신하고, 탐색 종료 시 마지막으로 갱신된 값을 반환하게 됩니다.


아래 BST에서 `Floor(18)` 예시를 보겠습니다.

![Pasted image 20250714021642](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250714021642.png)


`18 < 현재노드(20)` 이기 때문에 왼쪽 노드로 이동합니다.

![Pasted image 20250714022406](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250714022406.png)


`18 > 현재노드(15)` 이기 때문에 Floor(18)의 값을 현재 노드 값 `15로 갱신`하고, 오른쪽 노드로 이동합니다.

![Pasted image 20250714022430](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250714022430.png)


`18 > 현재노드(17)` 이기 때문에 Floor(18)의 값을 현재 노드 값 `17로 갱신`하고, 오른쪽 노드로 이동합니다.

![Pasted image 20250714022517](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250714022517.png)


`18 < 현재노드(19)` 이기 때문에 왼쪽 노드로 이동합니다. 하지만 더 이상 탐색할 노드가 없으므로 연산으로 종료합니다. 따라서 `Floor(18)의 값은 17`이 됩니다.

![Pasted image 20250714022535](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250714022535.png)


## Implementation

### Python

파이썬 코드는 재귀적으로(Recursive) 구현하지 않고 반복문(Iterative) 방식으로 작성하였습니다. 이때, 삭제 대상 노드가 루트 노드인 경우에는 별도로 처리해야 한다는 점을 잊지 말아야 합니다.

> 루트가 아닌 노드를 삭제할 때는 일반적으로 삭제 대상 노드의 부모 노드가 삭제 대상의 자식을 가리키도록 연결해주면 됩니다. 그러나 삭제 대상이 루트 노드인 경우에는 부모 노드가 존재하지 않기 때문에, 루트 자체를 직접 갱신해주어야 합니다.

```python
from __future__ import annotations  
from typing import Optional  
  
class Node:  
    def __init__(self, value: int):  
        self.value: int = value  
        self.left: Optional[Node] = None  
        self.right: Optional[Node] = None  
  
    def __gt__(self, other: Node) -> bool:  
        return self.value > other.value  
  
    def __ge__(self, other: Node) -> bool:  
        return self.value >= other.value  
  
    def __lt__(self, other: Node) -> bool:  
        return self.value < other.value  
  
    def __le__(self, other: Node) -> bool:  
        return self.value <= other.value  
  
    def __eq__(self, other: Node) -> bool:  
        return self.value == other.value  
  
    def __str__(self) -> str:  
        return f'{self.value}'  
  
    def __repr__(self) -> str:  
        return f"Node({self.value})"  
  
  
class BST:  
    def __init__(self):  
        self.root: Optional[Node] = None  
  
    def insert(self, value: int) -> None:  
        target = Node(value)  
        if self.root is None:  
            self.root = target  
            return  
  
        curr = self.root  
        while True:  
            if target < curr:  
                if curr.left is None:  
                    curr.left = target  
                    return  
                curr = curr.left  
            elif target > curr:  
                if curr.right is None:  
                    curr.right = target  
                    return  
                curr = curr.right  
            else:  
                return  
  
    def delete(self, value: int) -> Optional[int]:  
  
        def _remove_root(root: Node) -> None:  
            if root.left is None and root.right is None:  
                self.root = None  
            elif root.left and root.right:  
                _replace_with_successor(root)  
            else:  
                self.root = root.left if root.left else root.right  
  
        def _remove_non_root(parent: Node, node: Node) -> None:  
            if node.left is None and node.right is None:  
                if parent.left == node:  
                    parent.left = None  
                else:  
                    parent.right = None  
            elif node.left and node.right:  
                _replace_with_successor(node)  
            else:  
                child = node.left if node.left else node.right  
                if parent.left == node:  
                    parent.left = child  
                else:  
                    parent.right = child  
  
        def _replace_with_successor(target: Node) -> None:  
            succ_parent, succ = target, target.right  
            while succ.left:  
                succ_parent, succ = succ, succ.left  
  
            target.value = succ.value  
  
            if succ_parent.left == succ:  
                succ_parent.left = succ.right  
            else:  
                succ_parent.right = succ.right  
  
        parent, curr, target = None, self.root, Node(value)  
        while curr:  
            if curr == target:  
                break  
  
            if target < curr:  
                parent, curr = curr, curr.left  
            elif target > curr:  
                parent, curr = curr, curr.right  
  
        if curr is None:  
            return  
  
        if curr == self.root:  
            _remove_root(curr)  
        else:  
            _remove_non_root(parent, curr)  
  
        return curr.value  
  
    def search(self, value: int) -> bool:  
        curr, target = self.root, Node(value)  
        while curr:  
            if curr == target:  
                return True  
  
            if target < curr:  
                curr = curr.left  
            else:  
                curr = curr.right  
  
        return False  
  
    def ceil(self, value: int) -> Optional[int]:  
        curr, target, ans = self.root, Node(value), None  
        while curr:  
            if curr == target:  
                return curr.value  
  
            if target < curr:  
                ans = curr.value  
                curr = curr.left  
            else:  
                curr = curr.right  
  
        return ans  
  
    def floor(self, value: int) -> Optional[int]:  
        curr, target, ans = self.root, Node(value), None  
        while curr:  
            if curr == target:  
                return curr.value  
  
            if target > curr:  
                ans = curr.value  
                curr = curr.right  
            else:  
                curr = curr.left  
  
        return ans  
  
    def display(self) -> None:  
  
        def _prt(node: Optional[Node], indent: str = "", position: str = "root") -> None:  
            if node is not None:  
                print(f"{indent}[{position}] {node.value}")  
                _prt(node.left, indent + "   ", "L")  
                _prt(node.right, indent + "   ", "R")  
  
        _prt(self.root)  
  
  
bst = BST()  
for num in 20, 15, 25, 10, 17, 21, 31, 8, 13, 19, 24, 7, 12, 14: bst.insert(num)  
bst.display()  
print()  
  
print([bst.search(num) for num in (20, 15, 25, 10, 17, 21, 31, 8, 13, 19, 24, 7, 12, 14, 100, 11, 16)], sep=' ')  
print(bst.ceil(18))  
print(bst.floor(23))  
print(bst.delete(31))  
print(bst.delete(21))  
print(bst.delete(25))  
print(bst.delete(15))  
print()  
  
bst.display()
```


## Reference

[이진 탐색 트리](https://velog.io/@haero_kim/%EC%9D%B4%EC%A7%84-%ED%83%90%EC%83%89-%ED%8A%B8%EB%A6%AC-Binary-Search-Tree#%EC%82%AD%EC%A0%9C)

