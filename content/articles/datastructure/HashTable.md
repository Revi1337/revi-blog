---
title: HashTable
date: 2026-07-04
tags:
  - datastructure
  - hashtable
  - concept
description: "Key를 해시 함수를 통해 인덱스로 매핑하여 Key-Value 쌍을 O(1)에 조작하는 해시 테이블(HashTable)의 개념"
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/HashTable-thumbnail.jpg
---

## HashTable

HashTable 은 비선형 자료구조입니다. 일정 크기의 배열을 생성한 후에 Key 값을 `Hash 함수를 통해 배열의 Index 로 반환`하여, `해당 Index 에 해당 Key 값과 Value 를 저장`합니다. 대표적으로 Java의 HashMap, Python의 Dictionary 가 HashTable 에 해당합니다.

> HashTable에서 배열의 각 인덱스 위치에 존재하는 저장 공간을 버킷(Bucket)이라고 합니다. 각 버킷은 하나 또는 여러 개의 (Key, Value) 쌍을 저장할 수 있으며, 해시 함수의 결과로 도달한 인덱스에 저장됩니다.

- i 번째 데이터에 접근(Access)하는데 `NONE / *O(N)` 시간복잡도를 가집니다.
- X 라는 데이터(Key) 가 있는지 탐색하는데 `O(1)` 시간복잡도를 가집니다.
- X 라는 데이터(Key)에 접근(Access)하는데 `O(1)` 시간복잡도를 가집니다.
- X 라는 데이터(Key)의 삽입 & 삭제에 `O(1)` 시간복잡도를 가집니다.

![Pasted image 20250608011653](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250608011653.png)


## Hash Collision

HashTable 은 `무한에 가까운 Key 값을 유한한 메모리에 저장`해야 되기 때문에 아무리 뛰어난 성능의 Hash 로직을 사용하더라도 `Hash Collision(해시 충돌)이 필연적으로 발생`하게 됩니다.

> 해시 충돌은 서로 다른 Key 값에 대한 해시 함수의 결과가 동일한 Index(버킷) 를 가리키는 현상을 의미합니다. 연산 속도도 빠르며, 해시 충돌이 가능한 발생하지 않아야 성능이 좋은 Hash 함수라 말할 수 있습니다.

![Pasted image 20250608024949](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250608024949.png)


해시 충돌을 해결하는 방법으로는 `Open Addressing(개방 주소법)`과 `Chaining(체이닝)` 방법이 있으며, 프로그래밍 언어마다 채택하는 방식이 다릅니다. 해시 충돌이 발생하면 이 두 가지 해결 방법 모두 탐색 및 접근에 대한 시간 복잡도가 최악의 경우 `O(N)`까지 증가할 수 있습니다.

1. Open Addressing(개방 주소법) : 비어있는 다른 주소(버킷)에 데이터를 저장하는 방법입니다.
2. Chaining(체이닝) : 충돌이 발생한 주소(버킷)의 데이터들을 LinkedList 또는 BST(Binary Search Tree)로 연결하는 방법입니다.

> Java 에서는 Chaining 방식을 사용합니다. Hash 충돌한 데이터 수가 7개 이하까지는 LinkedList 를(탐색에 O(N)), 8개 이상이 되면 BST 로 변경하여 탐색에 드는 시간복잡도를 O(LogN) 으로 낮춥니다.


### Open Addressing

Open Addressing(개방 주소법)은 `비어있는 다른 주소(버킷)을 찾아` 해당 버킷에 데이터를 저장하는 방법입니다. 비어있는 버킷을 찾는 알고리즘에는 다음 세가지가 있습니다.

1. Linear Probing(선형 프로빙)
2. Quadratic Probing(이차식 프로빙)
3. Double Hashing(이중 해시)

먼저 아래 그림처럼 Python, Java, Kotlin, Bash 라는 Key 에 대한 해시충돌이 발생한다고 가정하겠습니다.

![Pasted image 20250608025041](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250608025041.png)


#### Linear Probing

선형 프로빙(Linear Probing)은 충돌이 발생했을 때, 다음 버킷(주소)을 `순차적으로 탐색하여 빈 자리를 찾아 데이터를 저장`하는 방식입니다.

1. `Python`의 해시 결과가 Index 1이므로, 해당 버킷이 비어 있으면 `Python`은 그 자리에 저장됩니다.
2. `Java`의 해시 결과도 Index 1이지만, 이미 `Python`이 저장되어 있기 때문에 충돌이 발생합니다. 이 경우 다음 버킷인 Index 2를 확인하고, 비어 있다면 그곳에 저장합니다.
3. `Kotlin`도 Index 1이 해시 결과이지만, Index 1에는 `Python`, Index 2에는 `Java`가 이미 저장되어 있으므로, 다음 버킷인 Index 3까지 탐색하여 그곳에 저장합니다.
4. `Bash`도 마찬가지로 Index 1, 2, 3이 모두 사용 중이기 때문에 Index 4까지 확인하여 데이터를 저장합니다.

![Pasted image 20250609150100](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250609150100.png)

> 이처럼 선형 프로빙은 구현이 간단하고 메모리 활용도가 높다는 장점이 있지만, 충돌된 데이터들이 한곳에 밀집되어 저장되는 Primary Clustering(1차 클러스터링) 현상이 발생할 수 있습니다. 이로 인해 탐색 및 삽입 시 순차적으로 많은 버킷을 확인해야 하므로, 성능이 점점 저하될 수 있는 단점이 있습니다.

> [!note] Primary Clustering
> Primary Clustering(1차 클러스터링)은 주로 선형 탐사(Linear Probing)에서 나타나는 문제로, 충돌이 발생한 위치 주변에 데이터가 밀집해 점점 큰 덩어리(Cluster)가 생기는 현상입니다. 즉, 데이터가 연속된 구간에 몰려서 클러스터가 커지는 현상을 말합니다.



#### Quadratic Probing

이차 프로빙(Quadratic Probing)은 충돌이 발생했을 때, 충돌이 발생한 인덱스로부터 `일정한 제곱 수만큼 떨어진 위치를 순차적으로 탐색`하여 빈 자리를 찾아 데이터를 저장하는 방식입니다.

1. Python 의 해시 결과가 Index 1이므로, 해당 버킷이 비어 있으면 그대로 저장됩니다.  
2. Java 의 해시 결과도 Index 1이지만, 이미 `Python`이 저장되어 있기 때문에 충돌이 발생합니다. 이 경우 첫 번째 시도는 `1 + 1² = 2`번 인덱스를 확인하고, 비어있다면 그곳에 저장합니다.  
3. Kotlin 의 경우에도 마찬가지로 Index 1에서 충돌이 발생합니다. 첫 번째 시도인 Index 2에 `Java`가 저장되어 있다면, 두 번째 시도인 `1 + 2² = 5`번 인덱스를 확인하고 저장합니다.

![Pasted image 20250609141650](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250609141650.png)

> 이차 프로빙 방식은 충돌된 데이터를 분산시켜 연속적인 충돌(1차 클러스터링)을 줄일 수 있다는 장점이 있지만, 테이블 크기나 제곱 간격에 따라 빈 공간이 있음에도 탐색에 실패할 수 있고, Secondary Clustering(2차 클러스터링)이 발생할 수 있다는 단점도 있습니다.

> [!note] Secondary Clustering
> Secondary Clustering(2차 클러스터링)은 이차 프로빙(Quadratic Probing)에서 나타나는 문제로, 서로 다른 키라도 같은 해시값을 가지면, 충돌 해결을 위해 탐색하는 위치들이 동일한 순서로 반복되어, 특정 위치들에 데이터가 집중되는 현상입니다. 다만, 이 경우 클러스터가 반드시 연속적이지는 않습니다. 즉, 키별로 탐색 경로가 같아 데이터가 겹치는 현상이라 이해할 수 있습니다.


#### Double Hashing

이중 해싱(Double Hashing)은 충돌이 발생했을 때, `두 번째 해시 함수를 사용해 탐색 간격을 정하고`, 해당 간격만큼 떨어진 위치를 순차적으로 탐색하여 빈 자리를 찾아 데이터를 저장하는 방식입니다.

1. `Python`의 해시 결과가 Index 1이고, 해당 버킷이 비어 있다면 바로 저장됩니다.
2. `Java`의 해시 결과도 Index 1이고, 충돌이 발생하면 두 번째 해시 함수로부터 나온 값이 예를 들어 3(탐색 간격)이라면, 다음 확인할 인덱스는 `1 + 3 = 4`가 됩니다.
3. 이후 충돌이 또 발생하면 `1 + (3 * 2) = 7`, `1 + (3 * 3) = 10`처럼 일정한 간격을 유지하며 새로운 인덱스를 계산해 나갑니다

![Pasted image 20250609143600](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250609143600.png)

> 이중 해싱은 충돌 데이터를 더 넓게 분산시켜 선형이나 이차 프로빙보다 클러스터링이 적고 검색 효율이 우수합니다. 다만, 두 번째 해시 함수가 부적절하면 무한 루프에 빠질 수 있으므로, 보통 테이블 크기를 소수로 설정하고 두 번째 해시 함수 결과가 서로소가 되도록 구현해야 안전합니다.

> [!note] Quadratic Probing과 Double Hashing
> Quadratic Probing과 Double Hashing 모두 충돌된 데이터를 넓게 분산시키는 방식이지만, Double Hashing이 Quadratic Probing보다 더 고르게 분산됩니다. 이는 Quadratic Probing이 모든 키에 대해 동일한 탐색 간격을 사용하는 반면, Double Hashing은 두 번째 해시 함수를 통해 키마다 다른 탐색 간격을 사용하기 때문입니다.


### Chaining

Chaining(체이닝) 방법은 충돌이 발생한 버킷의 데이터들을 연결 리스트(Linked List) 또는 BST(Binary Search Tree)로 연결하는 방법입니다. 각 `버킷이 자체적으로 여러 값을 저장할 수 있는 구조`를 가지므로 충돌에 유연한 장점이 있습니다.


#### LinkedList

충돌이 발생하면, 해당 `버킷의 슬롯에 LinkedList의 Head노드의 주소를 저장`하고, 이후 충돌된 데이터들을 이 리스트에 연결해 나갑니다.

- 충돌된 데이터를 비어 있는 다른 버킷에 분산 저장하지 않기 때문에, `메모리 공간의 단편화를 줄이고 관리가 단순`하다는 장점이 있습니다.
- 하지만, 충돌된 데이터가 많아질 경우 리스트가 길어져 탐색에 최악의 경우 `O(N)`의 시간 복잡도가 발생할 수 있는 단점이 있습니다.

![Pasted image 20250609151632](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250609151632.png)


#### Binary Search Tree

충돌이 발생하면, 해당 `버킷의 슬롯에 Binary Search Tree(BST)의 Root 노드의 주소를 저장`하고, 이후 충돌된 데이터들을 트리에 넣어갑니다.

- 충돌된 노드를 BST에 삽입하거나 탐색하는 데는 평균적으로 `O(logN)`이 걸립니다. 예를 들어 데이터가 30억 개여도 약 30번만 내려가면 탐색 가능하므로, `탐색 효율이 매우 뛰어납니다.`
- 하지만 트리가 `불균형(Balanced Tree 가 아님)`하게 구성될 경우, 최악의 경우 시간 복잡도가 `O(N)`까지 증가할 수 있으며, 구현 복잡도와 균형 유지 비용이 발생한다는 단점이 있습니다.

![Pasted image 20250609154956](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-29/Pasted-image-20250609154956.png)


## Reference

- [김희성님 유튜브](https://www.youtube.com/watch?v=wkPWWwFFBM8&list=PLHOy1E8axXrfJJtDIXIOQBmWRPwM-GxSf&index=5&t=2152s)

