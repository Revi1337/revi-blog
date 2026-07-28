---
title: "Kruskal (크루스칼)"
date: 2026-07-25
updated_at: 2026-07-28
tags:
  - algorithm
  - kruskal
  - concept
description: "탐욕적 전략과 서로소 집합(Union-Find)을 활용하여 무방향 가중치 그래프의 최소 신장 트리(MST)를 구하는 크루스칼 알고리즘"
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Kruskal-thumbnail.jpg
---

## Kruskal

`Kruskal`은 무방향 가중치 그래프에서 `최소 신장 트리(MST)`를 구하는 알고리즘입니다. 가중치가 작은 간선부터 차례대로 선택하면서, 사이클이 생기지 않는 경우에만 간선을 추가함으로써 트리를 `점진적이지만 불연속적인 방식으로 확장`해 나갑니다.

- Kruskal은 `Greedy` 전략과 `Disjoint Set(서로소 집합)` 자료구조를 함께 활용합니다.
	- 간선을 가중치가 작은 순서대로 선택하여 MST를 구성하므로, Greedy 특성을 가집니다.
	- 사이클을 확인하기 위해 Disjoint Set(서로소 집합)자료구조를 활용하며, Union-Find 알고리즘을 사용합니다.

> "트리를 불연속적으로 확장한다"의 의미는, MST가 처음엔 여러 개의 분리된 부분 트리들로 시작하여, 간선이 추가될 때마다 이들이 병합되며 결국 하나의 연결된 트리로 완성된다는 것을 의미합니다.


## Mechanism

Kruskal 알고리즘은 아래 과정으로 동작합니다.

1. `초기화` : 모든 간선들을 가중치 오름차순으로 정렬합니다.
2. `간선 선택(Greedy Choice)` : 가장 작은 간선부터 시작하여, MST에 이미 포함된 간선과 사이클을 형성하지 않으면 해당 간선을 MST에 추가합니다.
	- 사이클의 형성은 선택된 간선에 연결된 두 노드(node1, node2)가 같은 집합에 속해있는지 여부로 판단합니다.
	-  `Union-Find` 알고리즘을 이용해 두 노드의 대표 노드(루트) 를 찾습니다.
		- 두 대표 노드가 같다면 사이클이 생기므로 간선을 건너뜁니다.
		- 다르다면 두 집합을 합치고, 해당 간선을 최소 신장 트리에 추가합니다.
3. `반복` : MST에 포함된 간선의 수가 `정점의 수 - 1` 개가 될 때까지 2번 과정을 반복합니다.


이제 아래 그래프를 기준으로 최소 신장 트리(MST) 를 직접 구해보겠습니다.

![Pasted image 20250717195608](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250717195608.png)


가장 먼저, 주어진 간선들을 가중치 기준으로 오름차순 정렬합니다. 동시에, 사이클 발생 여부를 판별할 수 있도록 각 노드가 속한 집합의 대표 원소를 기록하는 `parents` 배열을 초기화합니다.

> parents 배열에서 인덱스(index) 는 노드 번호를 의미하고, 배열의 값(parent)은 해당 노드가 속한 집합의 대표 원소(루트 노드)를 나타냅니다. 초기에는 모든 노드가 자기 자신을 대표로 갖습니다.

![Pasted image 20250717195908](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250717195908.png)


가중치가 가장 작은 `1번 Node ──▶ 3번 Node = 비용 1` 간선을 확인합니다.

- 1번 노드의 대표노드는 `1`, 2번 노드의 대표노드는 `3` 입니다.
- 두 노드가 서로 다른 집합에 속해 있으므로, 두 집합을 하나로 합칩니다.
- 동시에 해당 간선을 MST에 연결합니다.

![Pasted image 20250717195929](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250717195929.png)


가중치가 두 번째로 작은 `2번 Node ──▶ 3번 Node = 비용 1` 간선을 확인합니다.

- 2번 노드의 대표노드는 `2`, 3번 노드의 대표노드는 `1` 입니다.
- 두 노드가 서로 다른 집합에 속해 있으므로, 두 집합을 하나로 합칩니다.
- 동시에 해당 간선을 MST에 연결합니다.

![Pasted image 20250717200013](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250717200013.png)


`3번 Node ──▶ 5번 Node = 비용 2` 간선을 확인합니다.

- 3번 노드의 대표노드는 `1`, 5번 노드의 대표노드는 `5` 입니다.
- 두 노드가 서로 다른 집합에 속해 있으므로, 두 집합을 하나로 합칩니다.
- 동시에 해당 간선을 MST에 연결합니다.

![Pasted image 20250717200140](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250717200140.png)


`1번 Node ──▶ 2번 Node = 비용 3` 간선을 확인합니다.

- 1번 노드의 대표노드는 `1`, 2번 노드의 대표노드는 `1` 입니다.
- 두 노드가 서로 같은 집합에 속해 있으므로, 건너뜁니다.

![Pasted image 20250717200205](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250717200205.png)


`1번 Node ──▶ 4번 Node = 비용 4` 간선을 확인합니다.

- 1번 노드의 대표노드는 `1`, 4번 노드의 대표노드는 `4` 입니다.
- 두 노드가 서로 다른 집합에 속해 있으므로, 두 집합을 하나로 합칩니다.
- 동시에 해당 간선을 MST에 연결합니다.

![Pasted image 20250717200239](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250717200239.png)


`3번 Node ──▶ 4번 Node = 비용 5` 간선을 확인합니다.

- 3번 노드의 대표노드는 `1`, 4번 노드의 대표노드는 `1` 입니다.
- 두 노드가 서로 같은 집합에 속해 있으므로, 건너뜁니다.

![Pasted image 20250717200254](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250717200254.png)


`2번 Node ──▶ 5번 Node = 비용 6` 간선을 확인합니다.

- 2번 노드의 대표노드는 `1`, 5번 노드의 대표노드는 `1` 입니다.
- 두 노드가 서로 같은 집합에 속해 있으므로, 건너뜁니다.

![Pasted image 20250717200309](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250717200309.png)


`4번 Node ──▶ 5번 Node = 비용 7` 간선을 확인합니다.

- 4번 노드의 대표노드는 `1`, 5번 노드의 대표노드는 `1` 입니다.
- 두 노드가 서로 같은 집합에 속해 있으므로, 건너뜁니다.

![Pasted image 20250717200319](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250717200319.png)


모든 간선을 확인했으므로, 크루스칼 알고리즘이 종료됩니다. 따라서 주어진 그래프에서 `최소 신장 트리는 가중치의 합이 8`인 부분 그래프가 됩니다.

![Pasted image 20250717200733](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20250717200733.png)


## Implementation

```python
def kruskal(mx_node, edges):  
  
    def find(n):  
        if n == parents[n]:  
            return n  
  
        parents[n] = find(parents[n])  
        return parents[n]  
  
    def union(n1, n2):  
        r1, r2 = find(n1), find(n2)  
        if r1 < r2:  
            parents[r2] = r1  
        else:  
            parents[r1] = r2  
  
    edges.sort(key=lambda x: x[2])                  # 간선을 가중치가 작은 순으로 정렬  
    mst, parents = [], [*range(mx_node + 1)]        # mst & parents 배열을 초기화  
    for v1, v2, cost in edges:                      # 간선 순회  
        if find(v1) != find(v2):                    # 간선을 이루는 두 노드의 집합이 다르면(대표 원소가 다르면)  
            union(v1, v2)                           # 두 집합을 합친다  
            mst.append([v1, v2, cost])              # 해당 간선을 MST에 포함시킨다  
  
    return mst, sum(edge[2] for edge in mst)  
  
print(kruskal(  
    7,  
    [[1, 2, 3],  
    [1, 3, 1],  
    [1, 4, 4],  
    [2, 3, 1],  
    [2, 5, 6],  
    [3, 4, 5],  
    [3, 5, 2],  
    [4, 5, 7]]  
))  
# output (MST 를 구성하는 간선들, MST의 비용)  
# [[1, 3, 1], [2, 3, 1], [3, 5, 2], [1, 4, 4]], 8
```


결과는 아래와 같이 나오게 됩니다.

```text
# MST 를 구성하는 간선들, MST의 비용
[[1, 3, 1], [2, 3, 1], [3, 5, 2], [1, 4, 4]], 8
```


## Time Complex

Kruskal 알고리즘의 시간복잡도는 `O(E LogE)` 입니다. 크루스칼 내에 연산들에 대한 시간복잡도는 아래와 같습니다.

| 단계             | 설명                               | 시간 복잡도                                        |
| -------------- | -------------------------------- | --------------------------------------------- |
| 간선 정렬          | 간선을 가중치 기준으로 정렬                  | O(E log E)                                    |
| Union-Find 초기화 | 각 노드의 부모를 자기 자신으로 설정             | O(V)                                          |
| 간선 순회 및 사이클 판별 | 최대 E개의 간선에 대해 `find`와 `union` 수행 | O(E α(V))  <br>※ α(V): 매우 느리게 증가하는 아커만 함수 역함수 |

> 전체 시간복잡도는 O(ElogE + Eα(V))이지만, α(V)는 상수로 취급되기 때문에, O(E LogE)로 요약할 수 있습니다.


## Reference

- [크루스칼 알고리즘, 최소신장 트리(MST)](https://chanhuiseok.github.io/posts/algo-33/)
- [크루스칼 알고리즘이란](https://gmlwjd9405.github.io/2018/08/29/algorithm-kruskal-mst.html)
- [크루스칼 알고리즘](https://velog.io/@sy508011/%EA%B7%B8%EB%9E%98%ED%94%84-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98-%ED%81%AC%EB%A3%A8%EC%8A%A4%EC%B9%BC-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98-Kruskal-Algorithm#%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98-%ED%8A%B9%EC%A7%95)
- [Difference between Prim's and Kruskal's algorithm for MST](https://www.geeksforgeeks.org/dsa/difference-between-prims-and-kruskals-algorithm-for-mst/)
