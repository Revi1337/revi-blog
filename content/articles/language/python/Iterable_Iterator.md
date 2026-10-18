---
title: "파이썬 Iterable과 Iterator 개념 및 내부 동작 정리"
date: 2026-08-02 15:27
updated_at: 2026-08-02 16:19
tags:
  - python
  - concept
description: "파이썬의 Iterable과 Iterator의 내부 원리, 구현 방법 및 차이점 정리"
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Python-Iterable-Iterator-Thumbnail.png
show_on_page: false
show_on_homepage: false
---

## Iterable

파이썬 [공식문서](https://docs.python.org/3/glossary.html#term-iterable)에서는 Iterable(반복형) 한 객체란 "안에 있는 원소(Element) 를 하나씩 반환 가능한 객체" 라고 정의하고 있습니다.

- Sequence 타입에서는 `list`, `str`, `tuple`, 그리고 Non-Sequence 타입에서는 `dict`, `set`, `file object`가 Iterable한 객체에 포함됩니다. 뿐만 아니라 `__iter__()` 메서드를 가진 사용자 정의 클래스도 Iterable한 객체로 간주됩니다. 
- 특이점으로는 Sequence 방식의 동작을 구현한 `__getitem__()` 메서드를 가진 사용자 정의 클래스도 Iterable처럼 동작합니다. 만약 `__iter__()`를 구현하지 않고 `__getitem__()`만 구현한다면, 파이썬은 0부터 시작하는 정수를 Index로 `__getitem__()`을 호출하며 `IndexError`가 발생할 때까지 순회하게 됩니다. 
- 모두 아는 내용이겠지만 Iterable은 곧 `for 문`으로 반복할 수 있다는 특징이 있습니다.

Sequence 데이터 타입은 기본적으로 Iterable 하다는 것을 알 수 있습니다. 

```python
# Sequence
test_string = 'testing word splitter'  
print(type(test_string))  
print(hasattr(test_string, '__iter__'))  
print(isinstance(test_string, collections.abc.Iterable))  
  
test_list = list(test_string)  
print(type(test_list))  
print(hasattr(test_list, '__iter__'))  
print(isinstance(test_list, collections.abc.Iterable))  
```

물론 Non Sequence 한 데이터 타입도 마찬가지 입니다.

```python
# Non Sequence
test_dict = dict()  
print(type(test_dict))  
print(hasattr(test_dict, '__iter__'))  
print(isinstance(test_dict, collections.abc.Iterable))  
  
test_set = set()  
print(type(test_set))  
print(hasattr(test_set, '__iter__'))  
print(isinstance(test_set, collections.abc.Iterable))
```

### Iterable 구현

사용자 정의 클래스에서 `__iter__()` 라는 매직 메서드를 구현하면 Iterable 한 객체로 간주되게 만들 수 있습니다. (yield 키워드는 현시점에서 알 필요가 없습니다.)

```python
class Sentence:  
  
    DEFAULT_SEPARATOR = ' '  
  
    def __init__(self, text):  
        self._words = text.split(Sentence.DEFAULT_SEPARATOR)  
  
    def __iter__(self):  
        for word in self._words:  
            yield word  
  
test_string = 'testing word splitter'  
sentence = Sentence(test_string)  
print(hasattr(sentence, '__iter__'))  
print(isinstance(sentence, collections.abc.Iterable))  
words = [word for word in sentence]
```

### Sequence 가 반복 가능한 이유

특이하게 파이썬에서는 `__iter__()`  를 구현하지 않고 Sequence 방식의 동작을 구현한 `__getitem__()` 만 구현해도 `Iterable 처럼` 동작합니다. 아래 코드를 보면 Iterable 하지 않은데 List Comprehension 이 이루어진 것을 볼 수 있습니다. 이것이 왜 가능한 걸까요?

```python
class Sentence:  
  
    DEFAULT_SEPARATOR = ' '  
  
    def __init__(self, text):  
        self._words = text.split(Sentence.DEFAULT_SEPARATOR)  
  
    def __getitem__(self, item): # Sequence 방식의 동작을 구현한 __getitem__ 구현.
        return self._words[item]  
  
test_string = 'testing word splitter'  
sentence = Sentence(test_string)  
print(hasattr(sentence, '__iter__')) # False  
print(isinstance(sentence, collections.abc.Iterable)) # False  
words = [word for word in sentence] # Iterable 하지 않은데 for 문이 가능. 왜?
```

#### iter(Iterable) 의 원리

이 이유는 파이썬 인터프리터는 객체 x 가 반복해야할 때 언제나 `iter(x)` 를 내장함수를 호출하기 때문입니다. iter() 내장함수는 아래와 같은 과정을 수행합니다.

1. 객체가 `__iter__()` 메서드를 구현했는지 확인하고, 해당 메서드를 호출해서 Iterator(반복자) 를 가져옵니다.
2. `__iter__()` 메서드가 구현되어있지 않지만 `__getitem__()` 이 구현되어 있다면, 파이썬은 Index 0 부터 시작한 요소부터 끝까지 순서대로 가져오는 Iterator(반복자)를 생성하게 됩니다.
3. 이 과정이 모두 실패하면 파이썬은 `TypeError: 'Class' object is not iterable` 이라는 메시지와 함께 TypeError 가 발생하게 됩니다.

파이썬의 모든 `Sequence` 는 모두 `__getitem__` 을 구현하고 있기 때문에, 파이썬의 모든 Sequence 는 반복 가능합니다. 따라서 위의 예제도 `__getitem__` 을 구현하였기 때문에 Sequence 로 취급되어 Iterable 처럼 동작하게 됩니다.

### 정확한 Iterable 판단

Iterable 한지 판단하는 기존의 방법은 `isintance(object, collections.abc.Iterable)` 로 확인하는 것이었습니다. 혹은 `hasattr(object, '__iter__')` 로 object 가 `__iter__` 메서드를 구현했는지 확인해보면 되었습니다. 하지만 해당 방법은 큰 오류가 있습니다. 

앞선 예시처럼 `__iter__()`  를 구현하지 않고 `__getitem__()` 만 구현하게 된다면, 분명 Iterable 처럼 동작하는데 Iterable 하지 않다고 출력되는 것을 볼 수 있습니다.

```python 
class Sentence:  
  
    DEFAULT_SEPARATOR = ' '  
  
    def __init__(self, text):  
        self._words = text.split(Sentence.DEFAULT_SEPARATOR)  
  
    def __getitem__(self, item):  
        return self._words[item]  
  
test_string = 'testing word splitter'  
sentence = Sentence(test_string)  
words = [word for word in sentence] # 반복 가능  
assert not isinstance(sentence, collections.abc.Iterable) # False
```

그렇다면 특정 객체가 Iterable 한지 아닌지 정확한 판단은 어떻게 할까요? 정답은 `iter(x)` 를 수행하고 `TypeError` 가 발생하는지 안하는지 확인하면 됩니다. `iter()` 함수는 내부적으로 `__getitem__` 을 구현했는지도 확인하는 반면, `isinstance(object, collections.abc.Iterable)` 는 확인하지 않기 때문입니다. 

> 사실 애시당초 iter 함수의 인자로는 Iterable 한 객체만 들어오도록 명시되어 있습니다.

```python
try:  
    iter(sentence)  
except TypeError:  
    print('Not Iterable')  
else:  
    print('Iterable')
```

## Iterator

Iterator 는 `__next__()` 메서드를 구현하고, `__iter__()` 메서드를 통해 자기 자신을 반환하는 객체를 의미합니다. 다른 말로 Iterator 는 Iterable 한 데이터의 흐름(Stream) 을 나타내는 객체를 의미합니다.  

- Iterator 는 내장함수인 `iter(Iterable)` 를 통해 만들 줄 수 있습니다.
- 만들어진 Iterator 는 내장 함수인 `next()` 혹은 `__next__()` 를 반복적으로 호출하여, Iterator(반복자 = 데이터 스트림)의 항목들을 순서대로 추출할 수 있습니다.
- Iterator 의 모든 원소를 순서대로 추출하고 나면 `StopIteration` 이라는 예외가 발생하게 됩니다.

Iterator 는 내장 함수인 `iter(Iterable)` 로 통해 만들어 줄 수 있습니다. 이렇게 만들어진 Iterator 는 `__next__` 라는 속성이 생기게 되는데, 이는 내장 함수인 `next()` 혹은 매직 메서드인 `__next__()` 로 다음 원소를 순서대로 하나씩 추출할 수 있음을 의미합니다.

```python
# Iterator
test_iterable = 'testing word splitter'  
test_iterator = iter(test_iterable)  
print(type(test_iterator))  
print(hasattr(test_iterator, '__next__')) # Iterator 는 next() 혹은 __next__() 를 통해 다음 원소를 추출할 수 있습니다.  
print(isinstance(test_iterator, collections.abc.Iterator))
```

### Iterator 는 상태를 기억한다

iter() 를 통해 만들어진 Iterator 를 next() 로 호출하게 되면, Iterator 의 요소를 하나씩 반환하게 됩니다. 여기서 중요한 것은 next() 를 호출할때마다 자신이 어디까지 호출했는지 기억하고 있다는 점을 기억해야합니다. 만약 맨 마지막 원소까지 호출했는데 한번 더 next() 를 호출하게 된다면 StopIteration 예외가 발생하게 됩니다.

> next() 함수는 단순히 Iterator 객체의 `__next__()` 메서드를 호출하는 역할을 할 뿐, 상태를 직접 관리하지 않습니다. 상태를 기억하는 책임은 Iterator 객체 내부에 있으며, 이는 Iterator가 내부적으로 데이터를 순회할 때 필요한 상태 (예: 현재 인덱스) 를 유지하기 때문입니다.

```python
test_iterable = 'test str'  
test_iterator = iter(test_iterable)  
print(next(test_iterator)) # t  
print(next(test_iterator)) # e  
print(next(test_iterator)) # s  
print(next(test_iterator)) # t
print(next(test_iterator)) #   
print(next(test_iterator)) # s  
print(next(test_iterator)) # t  
print(next(test_iterator)) # r  
# print(next(test_iterator)) # StopIteration
```

### for 문의 원리

앞에서도 설명했지만 파이썬에서는 `Iterable 객체` 에  `for 문` 을 사용하게 되면 내부적으로 `iter()` 를 호출하게 됩니다. 이는 곧  `__iter__()` 를 호출하게 되어 Iterator (반복자) 를 얻게 됩니다. 그러고는 내부적으로 StopIteration 예외가 발생할때까지 `Iterator` 의 `next()` 를 호출하여 Iterator 의 원소들을 하나씩 순서대로 추출하게 됩니다. for 문을 원리는 아래와 같습니다.

1. for 문을 사용합니다.
2. 내부적으로 iter() 를 호출합니다.
	1. `__iter__()` 이 구현되어있는지 확인합니다. 구현되어있으면 Iterator(반복자) 를 반환합니다.
	2. `__iter__()` 메서드가 구현되어있지 않지만 `__getitem__()` 이 구현되어 있다면, 파이썬은 Index 0 부터 시작한 요소부터 끝까지 순서대로 가져오는 Iterator(반복자)를 생성하게 됩니다.
	3. 이 과정이 모두 실패하면 파이썬은 `TypeError: 'Class' object is not iterable` 이라는 메시지와 함께 TypeError 가 발생하게 됩니다.
3. Iterator(반복자) 가 리턴되었으면 내부적으로 `StopIteration` 가 발생할때까지 `next()` 를 반복적으로 호출하여 원소들을 순서대로 추출합니다.

아래 코드는 for 문의 동작원리를 while 문으로 나타낸 것입니다.

```python
test_iterable = 'testing word splitter'  
test_iterator = iter(test_iterable)  
while True:  
    try:  
        print(next(test_iterator))  
    except StopIteration:  
        break
```

### Iterator 구현

Iterator 를 만들기 위해서는 꼭 `iter(Iterable)` 로 만들어야 할까요? 아닙니다. `__iter__` 와 `__next__` 를 재정의해주면 됩니다.

#### \_\_next\_\_ 구현

Iterator 가 자신의 반환 상태를 기억하는 것을 클론해보기 위해 `self._idx` 라는 인스턴스 변수와 `__next__()`  이용해볼 수 있습니다. next() 가 호출되면 내부적으로 `__next__()` 가 호출되는것을 응용하여 구현부에, 인덱스를 활용한 요소 반환 코드를 작성해줄 수 있습니다. 또한 index 에 오류가 발생하면 StopIteration 이 발생하게 코드를 작성해줄 수 있습니다. 아래와 같이 작성하면 next() 를 호출했때의 Iterator 의 상태변경을 그대로 구현해낼 수 있습니다.

```python
class Sentence:  
  
    DEFAULT_SEPARATOR = ' '  
  
    def __init__(self, text):  
        self._idx = 0  
        self._words = text.split(Sentence.DEFAULT_SEPARATOR)  
  
    def __next__(self): # next() 로 인해 __next__() 가 호출됩니다.  
        try:  
            word = self._words[self._idx]  
        except IndexError:  
            raise StopIteration('Stopped Iteration')  
        self._idx += 1  
        return word  
  
  
test_iterator = Sentence('testing word splitter')  
print(hasattr(test_iterator, '__iter__')) # False (__iter__ 구현 X)
print(hasattr(test_iterator, '__next__')) # True (__next__ 구현 O)
print(isinstance(test_iterator, collections.abc.Iterator)) # False ( __next__ 와 __iter__ 를 모두 구현해야 합니다.)
print(next(test_iterator)) # testing  
print(next(test_iterator)) # word  
print(next(test_iterator)) # splitter  
# print(next(test_iterator)) # StopIteration 발생
```

위 예제에서는 `__iter__()` 혹은 `__getitem__()` 을 구현하지 않아 Iterable 객체로 취급되지 않습니다. 이는 곧 `for 문`  을 돌릴 수 없다는 것을 의미합니다. 하지만, `__next__()` 를 구현했기 때문에 next() 를 통해 다음 원소들을 순서대로 추출이 가능합니다.

#### \_\_iter\_\_ 구현

그렇다면 `for 문` 을 돌릴 수 있게 하려면 어떻게 해야할까요? 바로 `__iter__()` 를 구현해주면 됩니다. 하지만 여기서 "어떻게 `__iter__()` 를 구현해야하지?" 라는 생각이 들 것입니다. 답은 `self` 를 리턴해주기만 하면 됩니다.

```python
class Sentence:  
  
    DEFAULT_SEPARATOR = ' '  
  
    def __init__(self, text):  
        self._idx = 0  
        self._words = text.split(Sentence.DEFAULT_SEPARATOR)  
  
    def __iter__(self): # __iter__ 구현
        return self  
  
    def __next__(self):  
        try:  
            word = self._words[self._idx]  
        except IndexError:  
            raise StopIteration('Stopped Iteration')  
        self._idx += 1  
        return word  
  
test_iterator = Sentence('testing word splitter')  
print(isinstance(test_iterator, collections.abc.Iterator)) # True  
words = [word for word in test_iterator]
```

왜 이것이 가능한걸까요? 앞서 `next()` 는 현재 자신이 어디까지 반환했는지에 대한 상태를 기억한다는 것을 알 수 있었습니다. `self._idx` 인스턴스 변수와 `__next__()` 매직 메서드로 이 상태 추적을 직접 구현했으니, 이제 for 문이 내부적으로 호출하는 `iter()` (== `__iter__()`) 에서 `__next__()` 를 연속적으로 호출할 수 있도록 `self` 만 반환해주면 됩니다.

이렇게 `__iter__()` 를 구현하면 객체 자체가 반복 가능한 객체가 되어 `for 문` 에서 자연스럽게 사용할 수 있습니다. 즉 `Sentence` 클래스는 **Iterable 객체** 와 **Iterator 객체** 의 특징을 동시에 갖추게 된 것이며, `__iter__()` 가 `self` 를 반환하는 이유도 객체 자체가 이미 `Iterator` 로서 동작하기 때문입니다.

## Iterable & Iterator 차이

**Iterable**

- `__iter__()` 메서드를 구현하거나, `__getitem__()` 메서드를 통해 sequence 방식으로 요소에 접근할 수 있는 객체를 의미합니다.
- 반복문(`for`)을 통해 순회할 수 있는 특징을 가집니다.
- `iter()` 함수로 Iterator 객체를 반환받을 수 있습니다.

**Iterator**

- `__next__()` 메서드를 구현하고, `__iter__()` 메서드를 통해 자기 자신을 반환하는 객체를 의미합니다.
- Stream 데이터처럼 요소를 하나씩 순차적으로 반환하며, 끝에 도달하면 `StopIteration` 예외를 발생시킵니다.
- 현재 상태를 기억하며, 한 번 반환된 값은 다시 반환되지 않습니다.

## Reference

- [Difference Between Iterator VS Generator](https://www.geeksforgeeks.org/difference-between-iterator-vs-generator/)
- [이터레이터와 제너레이터](https://mingrammer.com/translation-iterators-vs-generators/)
- [Iterable & Iterator & Generator](https://emjayahn.github.io/2019/07/15/iterator-generator/)
