---
title: "파이썬 시퀀스(Sequence) 및 논시퀀스(Non-Sequence) 자료형 정리"
date: 2026-08-02 15:07
updated_at: 2026-08-02 15:37
tags:
  - python
  - concept
description: "파이썬의 시퀀스 및 논시퀀스 자료형의 개념과 분류 기준 정리"
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Python-Sequence-NonSequence-Thumbnail.png
show_on_page: false
show_on_homepage: false
---

Python 에서 사용되는 자료형은 크게 `Sequence 자료형` 과 `Non Sequence 자료형` 으로 구분할 수 있습니다.

## Sequence

Python 에서 Sequence 자료형은 `순서가 있는 객체의 컬렉션` 을 의미합니다. Sequence 자료형의 가장 큰 특징은 `Index` 를 통해 각 요소에 접근한다는 점입니다. 대표적으로 `List, Tuple, String, range` 가 있습니다. Sequence 자료형은 아래와 같은 특징을 갖습니다.

- 순서가 보장 (Ordered) 됩니다. 따라서 각 요소를 Index 를 통해 접근할 수 있습니다.
- 반복(Iteration) 가능하므로 각 요소를 순회할 수 있습니다.
- Indexing, Slicing, Concatenation, Sorting 과 같이 Sequence 자료형을 조작할 수 있는 여러가지 Builtin Function 을 제공합니다.

> [!note] range 도 Sequence 자료형의 한 종류로 간주됩니다.
> range 는 파이썬에서 Sequence 자료형으로 분류되며, 클래스(class)로 정의된 객체 타입입니다. 이는 순서가 있는 Iterable 객체를 생성하며, 인덱싱과 슬라이싱이 가능합니다.

또한, Sequence 자료형은 담을 수 있는 항목의 자료형에 따라 `Container & Flat` 자료형. 그리고 가변 여부에 따라`Mutable & Immutable` 자료형 으로 분류할 수 있습니다.

### Container & Flat

Python의 Sequence 자료형은 담을 수 있는 항목의 자료형에 따라 `Container Sequence` 와 `Flat Sequence` 로 분류할 수 있습니다. 말이 조금 어려울 수 있는데, Sequence 자료형에 포함된 각 요소들이 동일한 자료형인지 여부에 따라 나눌 수 있다고 생각하시면 됩니다.

#### Container Sequence

Container Sequence(컨테이너 시퀀스) 는 `객체에 대한 Reference 를 담고 있으며 그 어떠한 자료형도 담을 수 있습니다.` List 로 예를 들면 List 안에 그 어떠한 자료형이 들어갈 수 있다는 의미입니다. 

- 대표적으로 list, tuple, deque 이 Container Sequence 에 해당합니다.

#### Flat Sequence

Flat Sequence(균일 시퀀스) 는 `객체에 대한 Reference 대신 자신의 메모리 공간에 각 항목의 값을 직접 담습니다.` 따라서 Flat Sequence 가 메모리를 더 적게 사용하지만, 문자, 바이트, 숫자 등 `기본적인 자료형만 저장할 수 있습니다.`

- 대표적으로 str, bytes, bytearray, memoryview, array 가 Flat Sequence 에 해당합니다.

### Mutable & Immutable

Python의 Sequence 자료형은 가변성에 따라 `Mutable Sequence`, `Immutable Sequence` 로도 분류할 수 있습니다.

#### Mutable Sequence

Mutable(가변) Sequence 는 변경 가능한 Sequence 자료형을 의미합니다. `이는 객체가 생성된 후, 그 내용을 변경할 수 있다는 것을 의미`합니다.

- 대표적으로 list, bytearray, array, deque, memoryview 형이 가변 시퀀스에 해당합니다.

#### Immutable Sequence

Immutable(불변) Sequence 는 변경 불가능한 Sequence 자료형을 의미합니다. `이는 객체가 한번 생성되면 그 내용을 변경할 수 없다는 것을 의미`합니다.

- 대표적으로 tuple, str, bytes 형이 불변 시퀀스에 해당합니다.

## Non Sequence

Python 에서 Non Sequence 자료형은 `순서가 없거나, 순서가 중요하지 않은 자료형` 을 의미합니다. 대표적으로 `Set, Dictionary` 가 있습니다. Non Sequence 한 자료형은 아래와 같은 특징을 갖습니다.

- 순서를 보장하지 않거나 (UnOrdered) 순서가 의미가 없습니다.
- Indexing 과 Slicing 이 불가능합니다.
- 반복(Iteration)은 가능하나 순서를 보장하지 않습니다.
- Set은 중복을 허용하지 않으며, Dictionary는 키(key)가 유일해야 합니다.

> [!note] Python 3.7 부터 Dictionary 는 순서를 보장한다.
> Python 3.7부터 Dictionary는 삽입 순서를 보장하도록 변경되었습니다. 하지만 여전히 키(key)를 통해 값(value)에 접근하는 매핑(mapping) 자료형이며, 순서보다는 키와 값 간의 관계가 중요합니다.

## Sequence & Non Sequence 차이

Sequence 한 자료형과 Non Sequence 한 자료형을 표로 정리하면 아래와 같습니다.

|                 | Sequence                | Non Sequence         |
| --------------- | ----------------------- | -------------------- |
| **순서 보장**       | O                       | X (3.7+ Dict: 순서 유지) |
| **인덱싱/슬라이싱 가능** | O                       | X                    |
| **반복 가능**       | O                       | O                    |
| **예시**          | list, tuple, str, range | set, dict            |

## Reference

- [Python Document](https://docs.python.org/3/glossary.html#term-sequence)
