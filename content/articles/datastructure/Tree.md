---
title: Tree
date: 2026-07-05
tags:
  - datastructure
  - tree
  - concept
description: "노드들이 부모-자식 관계의 계층적 구조를 이루는 비선형 자료구조인 트리(Tree) 개념"
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Tree-thumbnail.jpg
---

## Tree

트리(Tree)는 노드(Node)들이 계층적(Hierarchical)으로 `부모-자식 관계로 연결된 형태`를 갖는 `비선형 자료구조`입니다.

- 트리는 방향 그래프로도, 무방향 그래프로도 볼 수 있습니다.
	- 그래프 이론에서는 트리를 `하나의 연결 그래프`이자 사이클이 없고 모든 노드가 연결된 `무방향 비순환 그래프`로 정의합니다.
	- 반면, 컴퓨터 과학(자료구조)에서는 트리를 부모에서 자식으로 향하는 방향성을 가진 `방향 비순환 그래프(DAG)`로 정의합니다.

![Pasted image 20250709214624](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250709214624.png)


## Tree 구성요소

![Pasted image 20240731011919](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20240731011919.png)

| 이름                               | 설명                                        |
| -------------------------------- | ----------------------------------------- |
| Node (노드)                        | 트리를 구성하는 각각의 요소입니다.                       |
| Edge (간선)                        | 노드 간의 연결선입니다.                             |
| Root Node (루트 노드)                | 트리에서 최상위에 있는 노드이자 부모가 없는 노드입니다.           |
| Sibling Node (형제 노드)             | 동일한 부모를 가진 노드들입니다.                        |
| Leaf Node (Terminal Node, 단말 노드) | 자식이 없는 노드입니다.                             |
| Internal Node (내부 노드, 비단말 노드)    | Leaf Node를 제외한 모든 노드를 의미하며, 루트 노드도 포함됩니다. |
| Degree (차수)                      | 특정 노드의 자식 수입니다.                           |
| Depth (깊이)                       | 루트에서 특정 노드까지 간선 수 (`0`부터 시작)입니다.          |
| Level (레벨)                       | 트리의 각 층을 나타내는 번호 (`Depth + 1`의 값)입니다.     |
| Height (트리의 높이)                  | 루트에서 가장 깊은 노드까지의 깊이입니다.                   |


## Tree 의 특징

- `자료구조 관점`에서, 트리의 루트 노드를 제외한 모든 노드는 반드시 하나의 부모 노드를 갖습니다.
- `그래프 이론 관점`에서, 트리의 루트 노드에서 특정 노드로 가는 경로나 임의의 두 노드 사이의 경로는 항상 유일합니다. 다시 말해, 트리는 무방향 비순환 그래프의 일종이므로 두 노드 사이에는 반드시 하나의 경로만 존재합니다.
- `그래프 이론과 자료구조 관점 모두에서`, 트리는 모든 정점이 간선으로 연결되어 있으며, 정점의 수가 N개일 때 간선의 수는 항상 N - 1개입니다.


## Tree 의 분류

### 균형에 따른 분류

트리를 균형 상태를 기준으로 분류하면 `균형 트리(Balanced Tree)`와 `불균형 트리(UnBalanced Tree)`로 나눌 수 있습니다.

`균형 트리(Balanced Tree)`
- 각 노드를 루트노드로 하는 모든 서브트리의 높이 차이가 일정 범위 내로 유지되는 트리입니다.
- 일반적으로는 각 노드의 왼쪽과 오른쪽 서브트리 `높이 차이가 1이하인 경우를 균형 상태`로 봅니다. 
- 탐색, 삽입, 삭제 연산에서 최악의 경우에도 `O(log N)`을 보장합니다.

`불균형 트리(Unbalanced Tree)`
- 서브트리의 높이가 한쪽으로 크게 치우쳐 트리 구조가 비정상적으로 편향된 트리입니다.
- 이로 인해 트리의 깊이가 불필요하게 증가하고, 연산 성능이 최악의 경우 `O(N)`까지 저하될 수 있습니다.

> [!note] 서브트리의 높이
> 어떤 노드를 루트로 하는 서브트리에서 가장 깊은 리프 노드까지의 거리입니다.

![Pasted image 20250710010851](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250710010851.png)


### 자식 수에 따른 분류

각 노드가 가질 수 있는 자식의 수를 기준으로 `m-ary 트리`, `완전 m-ary 트리`, `전 m-ary 트리`, `포화 m-ary 트리`로 나눌 수 있습니다.

`m-ary 트리 (m-진 트리)`
- 각 노드가 최대 m개의 자식을 가질 수 있는 트리입니다. 
	- 이진 트리 (Binary Tree)는 각 노드가 최대 2개의 자식(왼쪽, 오른쪽)만 가질 수 있는 트리입니다.
	- 삼진 트리 (3-ary Tree)는 각 노드가 최대 3개의 자식만 가질 수 있는 트리입니다.

![Pasted image 20250710011846](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250710011846.png)


`완전 m-ary 트리 (Complete m-ary Tree)`
- 노드들이 왼쪽부터 순서대로 채워지는 `m-ary 트리`로, 마지막 레벨을 제외한 모든 레벨이 노드로 완전히 채워져 있고, 마지막 레벨은 왼쪽부터 순차적으로 노드가 채워져 있습니다.
	- 전 이진 트리(Complete Binary Tree)는 이진 트리 중에서도 마지막 레벨의 노드들이 왼쪽부터 순서대로 채워져 있으며, 그 위에 모든 레벨은 노드로 완전히 채워져 있습니다.

![Pasted image 20250710015308](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250710015308.png)


`전 m-ary 트리 (Fully m-ary 트리)`
- 모든 노드가 0개 또는 m개의 자식을 갖는 트리입니다.
	- 전 이진 트리(Fully Binary Tree)는 모든 노드가 0개 또는 2개의 자식을 갖는 트리입니다.

![Pasted image 20250710020808](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250710020808.png)


`포화 m-ary 트리 (Perfect m-ary 트리)`
- 모든 노드가 정확히 m개의 자식을 가지고, 모든 리프 노드가 동일한 깊이(Depth)에 존재하는 m-ary 트리입니다. 쉽게 말해, `전 m-ary 트리`이면서 `완전 m-ary 트리`를 만족하는 트리입니다.
	- 포화 이진 트리(Perfect Binary Tree)는 모든 노드가 정확히 2개의 자식을 가지며, 모든 리프 노드가 같은 깊이에 있는 이진 트리입니다.

![Pasted image 20250710022145](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250710022145.png)


### 노드의 순서 및 위치에 따른 분류

노드의 상대적 위치나 삽입 규칙, 순서 제약 조건에 따라 `이진 탐색 트리`, `힙`, `트라이` 등으로 나눌 수 있습니다.

이진 탐색 트리 (Binary Search Tree : BST) — [[BST]]
- `왼쪽 < 부모 < 오른쪽` 또는 `왼쪽 > 부모 > 오른쪽` 자식의 관계를 만족하는 이진트리입니다.
- 정렬된 데이터를 트리 형태로 구성하여 탐색, 삽입, 삭제 연산을 효율적으로 수행할 수 있습니다.
- 단, 트리가 불균형해질 경우 최악의 경우 탐색, 삽입, 삭제에 `O(N)`이 걸릴 수 있습니다. 
	- 이를 해결하기 위해  `AVL`, `RB Tree(Red-Black Tree)` 와 같은 균형 이진 트리가 도입되었습니다.
	- 최악의 경우에도 탐색, 삽입, 삭제에 `O(log N)`을 보장합니다.

![Pasted image 20250711001039](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250711001039.png)


힙 (Heap) — [[Heap]]
- `완전 이진 트리 기반`으로, 부모 노드가 자식보다 크거나(최대 힙) 작거나(최소 힙) 해야 합니다.
- 주로 우선 순위 큐 구현 및 힙 정렬에 사용되며, 최댓값/최솟값을 빠르게 찾아낼 수 있습니다.

![Pasted image 20250711001212](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250711001212.png)


트라이 (Trie) — [[Trie]]
- 문자열 검색을 위한 트리로, 노드 간의 순서가 중요하며 루트부터 경로를 따라가며 문자를 구성합니다.
- 주로 접두어 검색이나 자동완성 기능 등에 사용됩니다.

![Pasted image 20250711001315](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250711001315.png)


## Reference

[트리(Tree)란](https://gmlwjd9405.github.io/2018/08/12/data-structure-tree.html)

[트리는 방향 그래프인가? 무방향 그래프인가](https://dev-sia.tistory.com/25)

[코딩문 Tree Youtube](https://www.youtube.com/watch?v=QXuvE0Pon4g)

[코딩 인터뷰 완전분석 - 트리(Tree)와 그래프(Graph)](https://hungryjayy.github.io/posts/%EC%BD%94%EB%94%A9_%EC%9D%B8%ED%84%B0%EB%B7%B0_%EC%99%84%EC%A0%84%EB%B6%84%EC%84%9D-%ED%8A%B8%EB%A6%AC_%EA%B7%B8%EB%9E%98%ED%94%84/)

[힙, 트리, 그래프(Heap, Tree, Graph)](https://sohyeonnn.tistory.com/21)

[그래프와 트리](https://sanhan.tistory.com/entry/%EC%9E%90%EB%A3%8C%EA%B5%AC%EC%A1%B0-%EA%B7%B8%EB%9E%98%ED%94%84%EC%99%80-%ED%8A%B8%EB%A6%AC)

[방향/무방향 그래프의 정리](https://m.blog.naver.com/oh-mms/222045842438)

[DAG 알고리즘이란 무엇인가](https://steemit.com/dag/@cryptodreamers/dag-dag-directed-acyclic-graph)

[트리의 개념과 용어정리](https://jiwondh.github.io/2017/10/15/tree/)

[트리의 기초](https://velog.io/@kjh107704/%ED%8A%B8%EB%A6%AC-%ED%8A%B8%EB%A6%AC%EC%9D%98-%EA%B8%B0%EC%B4%88)

[Trees (트리 자료구조)](https://cdragon.tistory.com/entry/%EC%9E%90%EB%A3%8C%EA%B5%AC%EC%A1%B0%EC%99%80-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98-Trees#2.%20Binary%20trees%20(%EC%9D%B4%EC%A7%84%20%ED%8A%B8%EB%A6%AC)-1)

[이진트리의 종류](https://hsc-tech.tistory.com/7)
