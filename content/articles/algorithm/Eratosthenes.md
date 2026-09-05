---
title: Eratosthenes (에라토스테네스의 체)
date: 2026-07-20
updated_at: 2026-07-28
tags:
  - algorithm
  - math
  - eratosthenes
  - concept
description: 주어진 수 n 이하의 모든 소수를 소수의 배수를 지워나가는 방식으로 효율적으로 구하는 에라토스테네스의 체 알고리즘
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Eratosthenes-thumbnail.jpg
audio:
  - https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/media/2026-09-06/Eratosthenes-script.mp3
---

## 에라토스테네스의 체

에라토스테네스의 체는 고대 그리스 수학자 에라토스테네스가 개발한 `소수를 찾는` 효율적인 알고리즘입니다. 에라토스테네스의 체는 주어진 수 n 이하의 모든 소수를 찾기 위해 소수가 아닌 수를 체로 걸러내듯이 제거하는 방식으로 동작합니다. 즉, `소수의 배수를 차례로 지워나가면 남는 수가 소수`가 됩니다. 해당 알고리즘을 통해 소수를 매우 효율적이게 구할 수 있습니다.

## 에라토스테네스의 체 원리

우선 숫자 15 까지의 숫자 중 소수를 찾아야한다면 (15 + 1) 크기의 배열을 1로 초기화시켜줍니다.

> [!note] \+ 1 를 해주는 이유
> 배열은 index 가 0 부터 시작하기 때문입니다. 따라서 index 가 15 까지 있게 하려면 0 을 포함한 배열의 크기는 16 이 됩니다.

![Pasted image 20240710161339](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20240710161339.png)


소수는 2부터 시작하기 때문에 순회를 number = 2 부터 시작합니다. 그리고 자기 자신(소수 2) 를 제외한 소수의 배수(2,4,6,8,10,12) 를 0 으로 바꾸어 줍니다.

![Pasted image 20240710161354](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20240710161354.png)


마찬가지로 number = 3 일때도 마찬가지입니다.

![Pasted image 20240710161409](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20240710161409.png)


이렇게 15 까지의 수들 중 소수를 찾는 과정은 여기서 마무리됩니다.

![Pasted image 20240710165442](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-07-28/Pasted-image-20240710165442.png)

> [!note]
> 4 와 그 배수는 소수 2 의 배수 에서 이미 지워졌습니다.

## 왜 일부만 돌까?

여기서 의문이 들 수 있는 것은 "왜 15 까지 모두 순회를 하지 않냐" 입니다. 결론부터 말하면 15 의 제곱근인 3.87, 즉 3 이하까지만 순회하면 되고, 4 이상은 확인할 필요가 없습니다. 그 이유는 `소수의 배수를 지울 때 그 이상의 수는 이미 지워졌기 때문`입니다. 좀 더 정확한 이유는 아래와 같습니다.

- 2의 배수를 모두 지우면 남는 숫자 중 2의 배수는 없기 때문입니다.
- 3의 배수를 모두 지우면 남는 숫자 중 3의 배수는 없기 때문입니다.
- 4는 이미 2의 배수에서 지워졌고, 5는 소수이므로 지우지 않는 것입니다.

## Python 코드

이 과정을 Python 코드로 표현하면 아래와 같습니다.

```python
def solution(integer):  
    check = [1] * (integer + 1)  
    for number in range(2, int(integer ** 0.5) + 1):  
        if check[number]:  # number 가 지워져있으면 number 의 배수를 지울 필요가 없다.
            for offset in range(2, integer // number + 1):  
                check[number * offset] = 0  
  
    for number in range(2, integer + 1):  
        if check[number] == 1:  
            print(number, end = ' ')  
  
solution(15)

# 결과 : 2 3 5 7 11 13
```

## 시간복잡도

전체 알고리즘의 시간 복잡도는 O(nloglogn)

## 단점

**메모리 사용량**

- 에라토스테네스의 체는 n 크기의 배열을 사용합니다. 따라서 n 이 매우 클 경우, 메모리 사용량이 많아집니다. 예를 들어, n 이  10^9와 같은 큰 숫자일 경우, 배열의 크기가 매우 커지므로 메모리가 부족할 수 있습니다.
