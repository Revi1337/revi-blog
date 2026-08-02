---
title: "파이썬 네임스페이스와 스코프(Scope), LEGB Rule 정리"
date: 2026-08-02 15:37
updated_at: 2026-08-02 16:27
tags:
  - python
  - concept
description: "파이썬의 네임스페이스, LEGB 규칙, Scope 관련 키워드 및 동작 방식 정리"
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Python-Scope-Thumbnail.png
---

## 들어가며

모든 프로그래밍 언어에서는 변수가 유효한 범위를 의미하는 Scope 가 굉장히 중요합니다. 하지만 파이썬에서 Scope 를 이해하기 위해서는 Python 의 Namespace 에 대해 먼저 알 필요가 있습니다. 따라서 이번 포스팅에서는 `Python Namespace`, Namespace 에 따른 `Scope`, 인터프리터가 변수를 추적하는 `LEGB Rule`, 그리고 상위 Scope 의 변수 값을 변경 및 재할당하게 해주는 `nonlocal` 과 `global` 키워드에 대해 알아보려 합니다.  
  

## Namespace

Python 에서 Namespace 는 `Name 과 객체의 매핑` 을 저장하는 공간(컨테이너) 을 말합니다. Name 과 객체가 매핑되어 있기 때문에 Namespace 는 `dictionary` 데이터 타입으로 이루어져 있습니다. 또한, Mutable 하기 때문에 Namespace 의 내용을 바꿀 수 있습니다. 파이썬에서는 아래와 같이 4가지 Namespace 가 존재합니다.  
  
1. Built-In Namespace  
2. Global Namespace  
3. Local Namespace  
4. Enclosing Namespace  
  
Namespace 의 내용은 `locals()` 와 `globals()` 함수로 확인 가능합니다. Global Namespace 의 내용들을 확인하는 `globals()` 함수로 확인해보면 `dictionary` 형태로 이루어진 것을 알 수 있습니다.  
  
```python  
print(globals())    
# {'__name__': '__main__', '__doc__': None, '__package__': None, '__loader__': <_frozen_importlib_external.SourceFileLoader object at 0x1033c1f90>, '__spec__': None, '__annotations__': {}, '__builtins__': <module 'builtins' (built-in)>, '__file__': '/Users/revi1337/python-workspace/Algorithm/python-class/python_scope.py', '__cached__': None}
```  
  
> [!note] Namespace 는 왜 생겼을까?
> Python 에서 Namespace 는 변수 이름의 충돌 해결와 구조화된 관리를 위해 도입되었습니다. Namespace  덕에 다른 함수나 모듈에서 동일한 변수나 이름을 사용하는 경우, 네임스페이스를 통해 서로 영향을 받지 않을 수 있고, 코드가 복잡해져도 Namespace 를 통해 해당 변수나 Name 을 쉽게 추적할 수 있습니다.  
  

### Built-In Namespace

`Built-In Namespace` 는 Python 이 기본으로 제공하는 Built-In 객체들이 저장된 Namespace 를 말합니다. Built-In 네임스페이스에 저장된 Name 들은 Python이 실행되는 동안 언제나 사용할 수 있습니다. 아래 명령어를 사용하면 Built-In Namespace 에 포함되어있는 객체들을 확인할 수 있습니다. (빌트인 객체들은 너무 많아 대부분 생략했습니다.)  
  
```python  
print(globals()['__builtins__'])    
print(dir(globals()['__builtins__']))    
# <module 'builtins' (built-in)>
# ['ArithmeticError', 'AssertionError', 'AttributeError', ..., 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip']
```  

### Global Namespace

`Global Namespace` 은 `모듈` 수준에서 정의된  변수와 객체들이 저장된 Namespace 를 말합니다. Python 은 main 프로그램 본문이 시작될 때 Global Namespace 를 생성하며, 해당 Namespace 는 Interpreter 가 종료될 때까지 소멸되지 않고 유지됩니다. Global Namespace 에 존재하는 Name 들은 `globals()` 함수로 확인 가능합니다.  
  
> [!note] 모듈
> Python 에서의 모듈은 하나의 .py 파일을 의미합니다.  
  
```python  
var1, var2 = 10, 20    
def func():    
    ...    
func2 = lambda x: type(x)    
    
print(globals())    
print(globals()['var1'])    
print(globals()['var2'])    
print(globals()['func'])    
print(globals()['func2'])    
print()    
# {'__name__': '__main__', ..., 'var1': 10, 'var2': 20, 'func': <function func at 0x105426020>, 'func2': <function <lambda> at 0x105478860>}
# 10
# 20
# <function func at 0x105426020>
# <function <lambda> at 0x105478860>
```  
  
### Local Namespace

`Local Namespace` 는 함수 내부에서 정의된 변수나 객체가 저장된 Namespace 를 말합니다. 해당 Namespace 는 가장 안쪽에 위치하여 있습니다.  
  
- `함수 내부에서 정의된 args, 지역 변수` 등이 해당 네임스페이스에 저장됩니다.   
- Local Namespace 는 `함수가 호출될때 생성되고 함수가 종료되면 소멸`하게 됩니다.  
- 다른 Namespace 와 독립적이기 때문에 같은 이름의 변수가 다른 네임스페이스에 있더라도 영향을 받지 않습니다.  
- `locals()` 함수로 Local Namespace 의 내용을 확인할 수 있습니다.  
  
> [!note] Interpreter 는 가장 먼저 Local Namespace 를 확인합니다.
Python Interpreter 는 변수를 찾을 때 가장 먼저 Local Namespace 에서 찾게됩니다.  
  
```python  
def func(argv1, argv2):    
    local_var1, local_var2 = 10, 20    
    print(locals())    
    
func('test1', 'test2')    
# output : # {'argv1': 'test1', 'argv2': 'test2', 'local_var1': 10, 'local_var2': 20}
```  
  
### Enclosing Namespace

`Enclosing Namespace` 는 함수 내부에 또 다른 함수가 정의되어 있을 때. 즉 `Nested Function` 의 구조에서 `내부 함수에서에서 접근할 수 있는 외부 함수의 네임스페이스`를 의미합니다. 외부함수던 내부함수던 각 함수는 자신만의 Local Namespace 를 갖되, 자신을 감싼 외부 함수의 Namespace 가 내부 함수의 Enclosing Scope 가 됩니다. 아래 예제를 보겠습니다.  
  
outer_func, inner_func 가 Nested func 형태로 이루어져있습니다. outer_func, inner_func 모두 각자만의 Local Namespace 를 갖되, `outer_func 의 Local Namespace 가 inner_func 의 Enclosing Namespace` 가 됩니다.  
  
```python  
def outer_func(argv1, argv2):    
    """ Local Namespace & Enclosing Namespace for inner_func """    
    var1, var2 = 10, 20    
    print('outer_namespace', locals())    
    
    def inner_func(argv3, argv4):    
        """ Local Namespace """    
        var3, var4 = 30, 40    
        print('inner_namespace', locals())    
    
    inner_func(argv1, argv2)    
    
outer_func('var1', 'var2')    
# outer_namespace {'argv1': 'var1', 'argv2': 'var2', 'var1': 10, 'var2': 20}
# inner_namespace {'argv3': 'var1', 'argv4': 'var2', 'var3': 30, 'var4': 40}
```  

이는 어느정도 Depth 가 있는 Nested Function 에서도 마찬가지입니다.  
  
- outer_func 의 Local Namespace 는 inner_func 의 Enclosing Namespace 가 됩니다.  
- inner_func 의 Local Namespace 는 inner_inner_func 의 Enclosing Namespace 가 됩니다.  
- inner_inner_func 는 Local Namespace 만 존재합니다.  
  
```python  
def outer_func(argv1, argv2):    
    """ Local Namespace & Enclosing Namespace for inner_func """    
    var1, var2 = 10, 20    
    print('outer_namespace', locals())    
    
    def inner_func(argv3, argv4):    
        """ Local Namespace & Enclosing Namespace for inner_inner_func """    
        var3, var4 = 30, 40    
        print('inner_namespace', locals())    
    
        def inner_inner_func(argv5, argv6):    
            """ Local Namespace """    
            var5, var6 = 50, 60    
            print('inner_inner_namespace', locals())    
    
        inner_inner_func(argv3, argv4)    
    
    inner_func(argv1, argv2)    
    
outer_func('var1', 'var2')    
# outer_namespace {'argv1': 'var1', 'argv2': 'var2', 'var1': 10, 'var2': 20}
# inner_namespace {'argv3': 'var1', 'argv4': 'var2', 'var3': 30, 'var4': 40}
# inner_inner_namespace {'argv5': 'var1', 'argv6': 'var2', 'var5': 50, 'var6': 60}
```  
  

## Scope

`Scope` 는 프로그램 내에서 `변수 혹은 Name` 이 유효한 영역을 의미합니다. 쉽게 말해 현재 `자기자신이 속해 있는 Namespace` 를 의미합니다. Scope 는 Namespace 에 종속된 개념이기 때문에 Namespace 와 마찬가지로 4가지의 Scope 가 존재합니다.    
  
- **Local Scope**: 현재 자기자신(변수 혹은 Name) 이 Local Namespace 에 존재한다는 것을 의미합니다.  
- **Enclosing Scope**: 현재 자기자신(변수 혹은 Name) 이 Enclosing Namespace 에 존재한다는 것을 의미합니다.  
- **Global Scope**: 현재 자기자신(변수 혹은 Name) 이 Global Namespace 에 존재한다는 것을 의미합니다.  
- **Built-In Scope**: 현재 자기자신(변수 혹은 Name) 이 Built-In Namespace 에 존재한다는 것을 의미합니다.  
  
모든 변수는 현재 자기 자신이 속한 Scope 의 Namespace 에 `변수 이름 : 객체` 형태로 매핑되게 됩니다.  
  
```python  
var = 1    
print(globals())    
# {..., 'var': 1}
```  
  
## LEGB Rule

`LEGB Rule` 은 Python에서 `변수나 Name 을 참조할 때, 해당 변수나 Name 을 찾는 순서를 설명하는 규칙` 을 말합니다. 이 규칙은 변수 혹은 Name 이 검색되는 `Scope 의 순서` 를 나타내며, Local Scope, Enclosing Scope, Global Scope, Built-In Scope 의 첫 글자를 따서 `LEGB` 라고 부릅니다.   

### LEGB 동작 원리

따라서 파이썬 인터프리터는 변수나 Name 을 참조할 때 다음과 같은 순서로 변수나 Name 을 찾습니다. 자세한 원리는 다음과 같습니다.  
  
1. Local Scope 에서 변수나 Name 을 찾습니다.  
2. Local Scope 찾을 수 없으면 Enclosing Scope 에서 변수나 Name 을 찾습니다.  
	- Nested Function(가령 Closure) 일 경우, 가장 Outer Function 의 Local Scope (마지막 Enclosing Scope)까지 찾습니다.  
3. Enclosing Scope  에서도 찾을 수 없으면 Global Scope 에서 변수나 Name 을 찾습니다.  
4. Global Scope 에서도 찾을 수 없으면 Built-In Scope 에서 찾습니다.  
5. Built-in Scope 에서도 찾을 수 없으면 `NameError` 가 발생하게 됩니다.  

#### Local Scope 증명

아래는 Nested Function 형태로 작성된 코드입니다. 해당 코드의 출력 결과는 `1000000000.0`입니다. 왜 그럴까요? 최종적으로 `print` 문에서 출력하려는 `var` 변수는 `inner_inner_func`의 Local Scope 안에 정의되어 있기 때문입니다. 보다 정확한 프로세스는 아래와 같이 나타낼 수 있습니다.  
  
1. print() 하려는 변수 `var` 는 가장 먼저 `inner_inner_func 의 Local Scope` 에서 찾습니다.  
2. inner_inner_func 의 Local Scope에서 `var = 1e9`이 정의되어 있으므로 이를 출력하게 됩니다.  
  
```python  
def outer_func(argv1, argv2):    
    
    def inner_func(argv3, argv4):    
    
        def inner_inner_func(*args, **kwargs):    
            var = 1e9  # inner_inner_func 의 Local Scope  
            print(var)    
    
        inner_inner_func(argv3, argv4)    
    
    inner_func(argv1, argv2)    
    
outer_func('var1', 'var2')    
# output : 1000000000.0
```  
  
#### Enclosing Scope 증명

1. print() 하려는 변수 `var` 는 가장 먼저 `inner_inner_func 의 Local Scope` 에서 찾습니다.  
2. inner_inner_func 의 Local Scope 에 없으니 `Inner_inner_func 의 Enclosing Scope(Inner_func 의 local Scope)` 에서 `var` 를 찾습니다.  
3. Inner_inner_func 의 Enclosing Scope(Inner_func 의 local Scope) 에도 없으니, `inner_func 의 Enclosing Scope(outer_func 의 Local Scope)` 에서 `var` 를 찾습니다.  
4. inner_func 의 Enclosing Scope(outer_func 의 Local Scope) 에서 `var` 를 찾았으니 출력합니다.  
  
```python  
def outer_func(argv1, argv2):    
    
    def inner_func(argv3, argv4):    
    
        def inner_inner_func(*args, **kwargs):    
            print(var)    
    
        inner_inner_func(argv3, argv4)    
    
    var = -1e9    
    inner_func(argv1, argv2)    
    
outer_func('var1', 'var2')    
# output : -1000000000.0
```  

#### Global Scope 증명

1. print() 하려는 변수 `var` 는 가장 먼저 `inner_inner_func 의 Local Scope` 에서 찾습니다.  
2. inner_inner_func 의 Local Scope 에 없으니 `Inner_inner_func 의 Enclosing Scope(Inner_func 의 local Scope)` 에서 `var` 를 찾습니다.  
3. Inner_inner_func 의 Enclosing Scope(Inner_func 의 local Scope) 에도 없으니, `inner_func 의 Enclosing Scope(outer_func 의 Local Scope)` 에서 `var` 를 찾습니다.  
4. inner_func 의 Enclosing Scope(outer_func 의 Local Scope) 에서도 없으니 `Global Scope` 에서 var 를 찾습니다.  
5. Global Scope 에서 var 를 찾았으니 이를 출력합니다.  
  
```python  
var = 'global variable'    
    
def outer_func(argv1, argv2):    
    
    def inner_func(argv3, argv4):    
    
        def inner_inner_func(*args, **kwargs):    
            print(var)    
    
        inner_inner_func(argv3, argv4)    
    
    inner_func(argv1, argv2)    
    
outer_func('var1', 'var2')    
# output: global variable
```  

#### Built-In Scope 증명

1. print() 하려는 print 를 가장 먼저 `inner_inner_func 의 Local Scope` 에서 찾습니다.  
2. inner_inner_func 의 Local Scope 에 없으니 `Inner_inner_func 의 Enclosing Scope(Inner_func 의 local Scope)` 에서 `print` 를 찾습니다.  
3. Inner_inner_func 의 Enclosing Scope(Inner_func 의 local Scope) 에도 없으니, `inner_func 의 Enclosing Scope(outer_func 의 Local Scope)` 에서 `print` 를 찾습니다.  
4. inner_func 의 Enclosing Scope(outer_func 의 Local Scope) 에서도 없으니 `Global Scope` 에서 `print` 를 찾습니다.  
5. Global Scope 에서도 없으니 `Built-In Scope` 에서 `print` 를 찾습니다.  
6. print 라는 Built-In func 를 출력합니다.  
  
```python  
def outer_func(argv1, argv2):    
    
    def inner_func(argv3, argv4):    
    
        def inner_inner_func(*args, **kwargs):    
            print(print)    
    
        inner_inner_func(argv3, argv4)    
    
    inner_func(argv1, argv2)    
    
outer_func('var1', 'var2')  
# output : <built-in function print>
```  
  
#### NameError 증명

그 어떤한 Scope 에서도 var 이름을 찾을 수 없어 NameError 가 발생합니다.  
  
```python  
def outer_func(argv1, argv2):    
    
    def inner_func(argv3, argv4):    
    
        def inner_inner_func(*args, **kwargs):    
            print(var)    
    
        inner_inner_func(argv3, argv4)    
    
    inner_func(argv1, argv2)    
    
outer_func('var1', 'var2')    
# Name Error
```  

## Shadowing

`Shadowing` 은 어쩌면 너무나도 당연한 개념일 수 있습니다. Shadowing 은 `특정 Scope 에서 이미 정의된 변수를 덮어쓰는 현상`을 말합니다. 즉, 내부 스코프에서 외부 스코프에서 정의된 변수를 동일한 이름으로 덮어쓸 때 발생합니다.   
  
아래 코드를 보면 func 의 local scope 안에 있는 `변수 var` 가 상위 global scope 의 `변수 var` 를 `shadowing` 한 것을 볼 수 있습니다. 따라서 func() 안에서 호출되는 func 는 `local_var` 가 출력되는 것을 알 수 있습니다.  
  
```python  
var = 'global_var'    
  
def func():    
    var = 'local_var' # 내부 Scope 에서 상위 Scope 의 변수를 Shadow(가림) 하였습니다.  
    print(var) # local_var  
    
func()  
print(var) # global var  
```  
  
  
당연히 이러한 Shadowing 이라는 개념을 알고 local_var 이라는 출력 결과를 기대한것은 문제 없지만, 이러한 개념을 모른다면 문제가 발생할 수 있습니다.  
  
## Scope 관련 Keyword

`Scope`와 관련된 키워드로는 `nonlocal`과 `global`이 있습니다. 이 두 키워드는 모두 상위 Scope에 선언된 변수를 변경하거나 참조할 수 있게 도와준다는 공통점이 있지만, `변경하려는 변수가 위치하는 Scope에 따라 다르게 동작` 합니다.  
  
### global

`global` 키워드는 LEGB Rule 과 관계없이 `Global Scope == Global Namespace` 에서 선언된 변수를 변경하거나 참조할 때 사용되는 키워드입니다.  
  
Global Scope 과 Local Scope(정확히 outer_func 의 Local Scope) 에 모두 var 이라는 변수를 선언했습니다. 이 상태로 코드를 실행하게 된다면 `LEGB Rule` 에 의하여  `outer_func Local Scope variable` 라는 결과가 출력되게 될 것입니다.  
  
```python  
var = 'Global scope variable'  # Global Scope 변수  

def outer_func():    
    var = 'outer_func Local Scope variable' # outer_func Local Scope 변수  

    def inner_func():    
    
        def inner_inner_func():    
            print(var)    
    
        inner_inner_func()    
    
    inner_func()    
    
outer_func()  
# output : outer_func Local Scope variable
```  
  
  
만약, 실행결과로 `Global scope variable` 를 얻고싶다면 어떻게 해야할까요? 이 때 `global` 키워드를 사용할 수 있습니다. inner_inner_func 의 Local Scope 에서 global 키워드로 `"Global scope 에 있는 var 를 참조하겠다."`  라고 선언하면 Global Scope 의 변수에 액세스 할 수 있습니다.  
  
```python  
var = 'Global scope variable'  # Global Scope 변수  
  
def outer_func():    
    var = 'outer_func Local Scope variable'  # outer_func Local Scope 변수  

    def inner_func():    
    
        def inner_inner_func():    
            global var  # 추가  
            print(var)    
    
        inner_inner_func()    
    
    inner_func()    
    
outer_func()    
# output : Global scope variable
```  
  
  
global 키워드는 Global Scope 에 있는 변수의 값을 변경할 때도 사용됩니다. Global Scope 의 var 를 inner_inner_func 의 Local Scope 에서 변경해주었기 때문에, Global Scope 에서 출력되는 var 도 변경된 var 가 출력되게 됩니다.  
  
```python  
var = 'Global Scope variable'  # 여기가 바뀝니다.  
  
def outer_func():    
    var = 'outer_func Local Scope variable'    
    
    def inner_func():    
    
        def inner_inner_func():    
            global var    
            var += ' concat'    
            print(var)    
    
        inner_inner_func()    
    
    inner_func()    
    
outer_func()    
print(var) # 여기도 바뀐 var 가 출력됩니다.  
# output : Global Scope variable concat
# output : Global Scope variable concat
```  
  
#### 주의점

하지만 만약 global 키워드를 사용하지 않고 Global Scope 의 변수를 변경하면 어떻게 될까요? 바로 `UnboundLocalError` 이라는 오류가 발생하게 됩니다. 그 이유는 아래와 같습니다.  
  
파이썬은  `현재 Scope` 에 `변수 할당(=, +=) 이라는 것이 있으면 해당 변수를 Local Scope 변수로 취급`합니다. 아래 코드에서도 `+=` 를 통해 var 를 새롭게 할당하려 하고있습니다. 물론 += 를 풀어쓰면 `var = var + ' concat'` 이 됩니다. 당연히 새롭게 var 를 할당하려면 Local Scope 에서 기존의 var 을 찾아와야합니다. 하지만 기존의 `var` 가 Local Namespace 에서 찾을 수 없기 때문에 UnboundLocalError 가 발생하게 되는것입니다. 마찬가지로 이를 해결하기 위해서는 `global` 을 통해 "할당하려는 변수가 Global Scope 의 변수다" 라는것을 알려줘야 합니다.  
  
더 자세한 내용은 [Why am I getting an UnboundLocalError when the variable has a value?](https://docs.python.org/2/faq/programming.html#why-am-i-getting-an-unboundlocalerror-when-the-variable-has-a-value) 에서 찾아볼 수 있습니다.  
  
> [!note] UnboundLocalError
> UnboundLocalError 는 특정한 변수가 Local Namespace 에 할당되기 전에 참조되어서 발생하는 에러입니다.  
  
```python  
var = 'Global Scope variable'    
    
def outer_func():    
    
    def inner_func():    
    
        def inner_inner_func():    
           # global concat # 주석해제하면 문제가 해결됩니다.  
            var += ' concat'  # UnboundLocalError  
    
        inner_inner_func()    
    
    inner_func()    
    
outer_func()    
print(var)  
```  
  
  
아래 예제도 `UnboundLocalError` 가 발생합니다. 생각하지 않으면 `print 에 사용되는 var 는 LEGB Rule 에 의해 Global Scope 의 var 가 출력되고.. 새롭게 할당되는 var 는 Local Namespace 에 할당되겠구나!!` 라고 생각할 수 있습니다.  
  
UnboundLocalError 가 발생하는 이유는 앞서 마찬가지로.. 해당 Scope 에서 `변수 할당` 이라는 행위가 일어나기 때문입니다. 해당 Scope 에서 var 라는 변수가 `??` 로 할당하려 하기 때문에, var 는 Local Scope 변수로 취급되게 됩니다. 근데 할당하기 전에 print() 로 값을 찍어내려하므로, Local Namespace 에 var 가 없어 UnboundLocalError 가 발생하게 되는 것입니다.  
  
```python  
var = 'Global Scope variable'    
    
def outer_func():    
    
    def inner_func():    
    
        def inner_inner_func():    
            print(var)  # UnboundLocalError  
            var = '??'    
    
        inner_inner_func()    
    
    inner_func()    
    
outer_func()  
```  
  
> [!note] 파이썬은 인터프리터 언어인데 print 후에 실행되는 var 변수 할당은 어떻게 감지하나요?
> 파이썬은 인터프리터 언어가 맞습니다. 그래서 Runtime 시점에 결과를 출력하거나 동작을 수행합니다. 하지만 파이썬의 내부 구현체는 C 로 이루어져있습니다. 이는 즉 컴파일러가 관여한다는 것을 의미합니다. 여기서 Compiler 가 관여하는 부분중 하나가 Scope 와 관련된 변수의 결정입니다. 그래서 Runtime 이 아니라 Compile 시점에 이루어집니다.  
>   
> 파이썬에서 함수 내부에서 변수를 참조하거나 할당하려고 할 때, Compiler 는 해당 변수가 Local Scope 인지 아닌지를 미리 판단합니다. 이는 성능 최적화와 실행 중 혼란을 방지하기 위해서인데, 이 때문에  var 에 값을 할당하는 행위가 함수 내부에서 발견되면, 파이썬은 var 를  Local Scope 변수라고 간주하게 됩니다.  
>   
> - 파이썬은 인터프리터 언어지만, 스코프와 변수의 영역 결정은 컴파일 시점에 이루어집니다.  
> - 함수 내부에서 변수에 값을 할당하는 코드가 있으면, 파이썬은 그 변수를 Local Scope 로 간주합니다.  
> - 이로 인해 함수 내부의 print(var)가 외부 변수를 참조하지 못하고 초기화되지 않은 Local Scope 변수를 참조하려다가 UnboundLocalError 가 발생하게 되는 것입니다.  
  
### nonlocal

`nonlocal` 키워드는 LEGB Rule 과 관계없이 `Enclosing Scope 의 변수를 Local Scope 로 가져와 참조하거나 수정할때 사용되는 키워드`입니다. 즉, Nested Function 과 같은 형태에서 inner_func 에서 outer_func 의 Local Scope 에 있는 변수에 접근하거나 변경하고자 할때 사용합니다.  
  
아래와 같은 같이 enclosing scope 의 var 를 참조만 하는 경우에는 nonlocal 키워드를 쓰든 안쓰든 동일하게 `outer_func Local Scope variable` 가 출력되게 됩니다. `LEGB Rule` 로 인해 otuer_func 의 var 가 출력되기 때문이죠.  
  
```python  
var = 'Global Scope variable'    
    
def outer_func():    
    var = 'outer_func Local Scope variable'    
    
    def inner_func():    
    
        def inner_inner_func():    
            nonlocal var # 읽을때는 LEGB Rule 로 인해 var 있어도 되고 없어도 됩니다.   
            print(var)    
    
        inner_inner_func()    
    
    inner_func()    
    
outer_func()  
# output : outer_func Local Scope variable
```  
  
  
하지만 Enclosing scope 의 변수를 변경(재할당) 혹은 변경 하는 경우에는 `nonlocal` 키워드로 Enclosing Scope 의 변수를 재할당 혹은 변경하겠다고 알려주어야 합니다.  
  
```python  
var = 'Global Scope variable'    
    
def outer_func():    
    var = 'outer_func Local Scope variable'    
    
    def inner_func():    
    
        def inner_inner_func():    
            nonlocal var    
            var += ' concat'    
            print(var) # 2    
    
        print(var) # 1    
        inner_inner_func()    
        print(var) # 3    
    
    inner_func()    
    
outer_func()    
# outer_func Local Scope variable
# outer_func Local Scope variable concat
# outer_func Local Scope variable concat
```  
  

#### 주의점

주의점은 앞서 설명한 [[Scope#주의점|global 의 주의점]] 과 적용되는 Scope 범위만 다를뿐 완벽히 동일합니다.  
  
### global & nonlocal 차이

| 키워드        | 적용 스코프                                | 역할                                 | 사용 가능 위치                               | 제한사항 및 주의점                                                                |
| ---------- | ------------------------------------- | ---------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| `global`   | Global Scope (Global Namespace)       | 현재 함수 내에서 전역 변수를 참조 및 수정 가능하게 함    | 함수 내부 (로컬 스코프에서만 사용 가능)                | - 전역 변수와 이름이 같은 로컬 변수가 있어도 로컬 변수를 참조하지 않음<br>- 오직 글로벌 스코프에 선언된 변수에만 적용 가능 |
| `nonlocal` | Enclosing Scope (Enclosing Namespace) | 현재 함수 내에서 상위 함수의 로컬 변수를 참조 및 수정 가능 | 중첩 함수 내부 (Nested Function, 가령 Closure) | - Enclosing Scope가 없으면 SyntaxError 발생<br>- 글로벌 스코프에 선언된 변수에는 적용 불가능       |

## Reference
  
- 전문가를 위한 파이썬 (교재)  
- [Real Python](https://realpython.com/python-namespaces-scope/#variable-scope)
- [Real Python](https://realpython.com/python-scope-legb-rule/)
- [Why am I getting an UnboundLocalError when the variable has a value?](https://docs.python.org/2/faq/programming.html#why-am-i-getting-an-unboundlocalerror-when-the-variable-has-a-value)
