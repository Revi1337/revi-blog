---
title: "Spring Transcation Interview"
date: "2026-7-12"
updated_at: "2026-7-12"
tags: ["spring", "interview"]
thumbnail: "https://upload.wikimedia.org/wikipedia/commons/4/44/Spring_Framework_Logo_2018.svg"
thumbnail_fit: "contain"
---

## Transaction

### @Repository를 선언하면 어떤 이점이 있나요?

@Repository가 선언된 빈은 PersistenceExceptionTranslationPostProcessor에 의해 프록시로 감싸지며, HibernateException, SQLException 같은 기술 종속적인 예외를 Spring의 DataAccessException 계층으로 변환해줍니다. 덕분에 상위 레이어가 특정 퍼시스턴스 기술에 종속되지 않고, 일관된 예외 처리가 가능합니다.


### @Transactional이 왜 AOP 기반으로 동작하나요?

`@Transactional`은 트랜잭션 처리라는 공통 관심사를 비즈니스 로직과 분리하기 위해 AOP 프록시로 구현되어 있습니다.  

Spring에서는 `TransactionInterceptor`라는 Around기반 Advice가 프록시를 통해 대상 메서드를 감싸며, 메서드 실행 전후로 트랜잭션을 시작하고 결과에 따라 커밋 또는 롤백을 수행합니다.


### @Transactional이 뭔가요? 왜 AOP 기반으로 동작하나요?

@Transactional은 트랜잭션 처리라는 공통 관심사를 비즈니스 로직에서 분리하기 어노테이션입니다. AOP 프록시 기반으로 동작하며, `TransactionInterceptor`가 Around Advice로 메서드를 감싸 실행 전 트랜잭션을 시작하고, 정상 종료 시 커밋, 예외 발생 시 롤백을 수행합니다.


### JpaRepository를 extends만 했는데 프록시가 어떻게 만들어지나요?

@EnableJpaRepositories AutoConfiguration으로 인해, Repository를 상속하는 인터페이스를 찾아 프록시를 생성합니다. 

1. @EnableJpaRepositories가 Repository(JpaRepository, CrudRepository, PagingAndSortingRepository) 상속 인터페이스 스캔
2. JpaRepositoryFactoryBean이 BeanDefinition으로 등록
3. JDK dynamic proxy 생성 (target = SimpleJpaRepository)


### 왜 Repository는 JDK Dynamic Proxy로 만들어지나요?

크게 두가지 이유가 있습니다.

첫 번째로, Repository 프록시를 만드는 주체가 Spring AOP가 아니기 때문입니다. 기본적으로 AOP 프록시는 CGLIB기반으로 만들어집니다. 하지만 Repository가 프록시로 만들어질 때는 `JpaRepositoryFactoryBean`에서 자체적으로 프록시를 생성하기 때문에 CGLIB가 사용되지 않습니다.

두 번째로, CGLIB는 대상 클래스를 상속해서 프록시를 만드는데, 사용자가 작성한 건 인터페이스뿐이라 상속할 구체 클래스 자체가 없습니다.


### @Transactional이 메서드와 클래스에 동시에 선언되어 있으면 어떻게 동작하나요?

더 구체적인 위치에 선언된 `@Transactional`이 우선 적용됩니다. 구체 클래스의 메서드가 가장 높은 우선순위를 가지며, 이후 구체 클래스, 인터페이스 메서드, 인터페이스 클래스 순으로 적용됩니다.


### @Transactional의 동작 원리를 설명해주세요.

외부에서 @Transactional이 붙은 메서드를 호출하면 프록시가 먼저 호출을 가로챕니다.

TransactionInterceptor가 PlatformTransactionManager를 통해 물리 트랜잭션을 시작하고, 동시에 TransactionSynchronizationManager를 통해 트랜잭션 컨텍스트를 생성합니다. 이 시점에 최초의 논리 트랜잭션 경계가 형성됩니다.

이후 같은 스레드에서 호출되는 @Transactional 메서드들은 propagation 정책에 따라 기존 논리 트랜잭션에 참여하거나, 새로운 트랜잭션을 생성합니다.

최종적으로 외부 트랜잭션의 commit 시점에 rollback-only 상태를 확인하여, 모두 정상이라면 commit을 수행하고, 하나라도 rollback-only 상태가 되면 전체 트랜잭션이 rollback됩니다.


### TransactionSynchronizationManager는 어떤 역할을 하나요?

Spring에서 트랜잭션 컨텍스트를 관리하는 핵심 컴포넌트입니다. 내부적으로 ThreadLocal을 사용해 현재 스레드의 Connection, EntityManager 같은 리소스를 바인딩하고, 트랜잭션 활성 여부와 동기화 콜백을 관리합니다.

덕분에 같은 스레드 안에서 호출되는 여러 메서드가 동일한 트랜잭션 컨텍스트를 공유할 수 있고, `@TransactionalEventListener` 같은 콜백도 이 동기화 콜백 시스템을 통해 트랜잭션 생명주기에 맞춰 실행됩니다.


### 논리 트랜잭션이 뭔가요? 왜 필요한가요?

논리 트랜잭션은 `@Transactional`을 기준으로 Spring이 정의하는 메서드 단위의 트랜잭션 경계입니다.

Spring은 비즈니스 로직을 메서드 단위로 나누기 때문에, 각 메서드마다 트랜잭션을 선언적으로 적용할 수 있도록 논리 트랜잭션 개념을 제공합니다.

이를 통해 여러 메서드가 하나의 물리 트랜잭션을 공유하면서도, 각 메서드 단위로 트랜잭션 경계를 나누고, propagation 정책에 따라 참여 여부나 독립 실행 여부를 유연하게 제어할 수 있습니다.

또한 내부 논리 트랜잭션에서 예외가 발생하면 rollback-only 상태를 설정하여, 최종적으로 전체 트랜잭션의 commit/rollback 여부를 결정하는 데에도 사용됩니다.


### 물리 트랜잭션과 논리 트랜잭션과은 어떤 차이가 있나요?

물리 트랜잭션은 실제 DB Connection을 기반으로 수행되는 트랜잭션으로, commit/rollback이 실제로 일어나는 단위입니다.

반면 논리 트랜잭션은 Spring이 `@Transactional`을 기준으로 정의한 메서드 단위의 트랜잭션 경계입니다.

하나의 물리 트랜잭션 안에 여러 개의 논리 트랜잭션이 존재할 수 있으며, 기본 전파 옵션인 `REQUIRED`에서는 여러 논리 트랜잭션이 하나의 물리 트랜잭션을 공유합니다.

이때 내부 논리 트랜잭션은 실제 commit을 수행하지 않고, 실패 시 rollback-only 상태를 설정하며, 최종 commit은 가장 바깥 논리 트랜잭션에서 한 번만 수행됩니다.


### 트랜잭션 전파(Propagation)가 무엇인가요?

트랜잭션 전파(Propagation)는 이미 진행 중인 트랜잭션이 있을 때, 현재 트랜잭션 요청이 기존 트랜잭션에 참여할지, 새로운 트랜잭션을 생성할지, 또는 트랜잭션 없이 실행할지를 결정하는 정책입니다.

내부적으로 `TransactionSynchronizationManager`에 현재 스레드의 트랜잭션 컨텍스트가 존재하는지 확인하고, propagation 설정에 따라 기존 컨텍스트에 참여하거나 새로운 물리 트랜잭션을 생성합니다. `@Transactional(propagation = ...)`으로 지정할 수 있습니다.


### 트랜잭션 전파 옵션 종류를 설명해주세요.

- `REQUIRED`는 기존 트랜잭션이 있으면 참여하고, 없으면 새로 생성합니다. 기본값입니다.
- `REQUIRES_NEW`는 기존 트랜잭션 유무와 관계없이 항상 새로운 물리 트랜잭션을 생성하고, 기존 트랜잭션은 일시 중단합니다.
- `SUPPORTS`는 기존 트랜잭션이 있으면 참여하고, 없으면 트랜잭션 없이 실행합니다.
- `NOT_SUPPORTED`는 항상 트랜잭션 없이 실행하며, 기존 트랜잭션이 있으면 일시 중단합니다.
- `MANDATORY`는 반드시 기존 트랜잭션에 참여해야 하며, 없으면 예외가 발생합니다.
- `NEVER`는 트랜잭션 없이 실행되어야 하며, 기존 트랜잭션이 있으면 예외가 발생합니다.
- `NESTED`는 기존 트랜잭션 안에 Savepoint를 찍어 중첩 트랜잭션을 생성합니다. 자식이 롤백되면 Savepoint까지만 롤백되고 부모는 계속 진행할 수 있지만, 부모가 롤백되면 자식도 함께 롤백됩니다.


### REQUIRED와 REQUIRES_NEW의 차이가 뭔가요?

기본 속성인 `REQUIRED` 전파는 기존 트랜잭션에 참여합니다. 같은 물리 트랜잭션을 공유하기 때문에, 내부에서 예외가 발생해 rollback-only가 마킹되면 외부 트랜잭션도 함께 롤백됩니다.

반면 `REQUIRES_NEW`는 기존 트랜잭션을 일시 중단하고 새로운 물리 트랜잭션과 트랜잭션 컨텍스트를 독립적으로 생성합니다. 때문에 내부 트랜잭션의 커밋/롤백이 외부 트랜잭션에 영향을 주지 않습니다.


### NESTED는 REQUIRES_NEW랑 뭐가 다른가요?

NESTED는 기존 트랜잭션 내부에 Savepoint를 생성해서 부분 롤백이 가능한 트랜잭션입니다.

REQUIRES_NEW는 기존 트랜잭션을 중단하고 완전히 독립된 새로운 물리 트랜잭션을 생성하는 반면, NESTED는 하나의 물리 트랜잭션 안에서 동작합니다.

따라서 NESTED는 내부에서 롤백이 발생하면 Savepoint 시점까지만 롤백되고 외부 트랜잭션은 계속 진행할 수 있지만, 외부 트랜잭션이 롤백되면 내부도 함께 롤백됩니다.

또한 JDBC Savepoint를 지원하는 환경에서만 동작한다는 제약이 있습니다.


### Spring의 기본 격리 수준은 무엇인가요?

`DEFAULT`이며, 이는 연결된 DB의 기본 격리 수준을 따릅니다. MySQL InnoDB 기준으로는 `REPEATABLE_READ`입니다.


### @Transactional은 어떤 예외에서 롤백되나요?

`@Transactional`은 기본적으로 `RuntimeException`과 `Error`에서 롤백되며, `Checked Exception`은 롤백되지 않습니다. 

내부적으로 TransactionInterceptor가 예외를 감지하면, 새로운 트랜잭션의 경우 해당 트랜잭션을 즉시 롤백합니다. 반면 이미 진행 중인 트랜잭션에 참여한 경우에는 즉시 롤백하지 않고 rollback-only로 마킹되며, 최종 커밋 시점에 이를 기준으로 최종 롤백 여부가 결정됩니다.

> DefaultTransactionAttribute.rollbackOn(throwable) 에서 RuntimeException과 Error 타입인지 검사함.


### rollback-only 가 뭔가요?

rollback-only는 현재 트랜잭션을 더 이상 커밋할 수 없음을 나타내는 상태 값입니다.

Spring에서는 이 상태를 TransactionStatus나 실제 트랜잭션 리소스(ConnectionHolder, EntityManager 등)에 플래그 형태로 저장하며, 이후 커밋 시점에 이 값을 확인해 실제 rollback을 수행하게 됩니다.


### rollback-only 는 언제 마킹되나요?

크게 두 가지 경우입니다.

논리 트랜잭션에서 예외가 발생해 `TransactionInterceptor`까지 전달됐을 때, 해당 논리 트랜잭션이 기존 트랜잭션에 참여한 상태라면 즉시 롤백하지 않고 rollback-only를 마킹합니다.

또는 개발자가 직접 `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()`를 호출하는 경우로, 예외를 catch로 삼킨 상황에서 롤백이 필요할 때 수동으로 마킹하는 방식입니다.


### rollback-only 어디에 저장되나요?

rollback-only 상태는 한 곳이 아니라, 트랜잭션 상태 객체와 실제 리소스 양쪽에서 관리됩니다.  

논리 트랜잭션 기준에서는 `TransactionStatus(DefaultTransactionStatus)`가 관리하고,  
물리 트랜잭션 기준에서는 `ConnectionHolder`나 `EntityManager` 같은 실제 리소스에 반영됩니다.  

이후 트랜잭션 매니저가 커밋 시점에 이 상태들을 종합해서 최종 rollback 여부를 결정합니다.

> 논리 트랜잭션 기준: TransactionStatus(DefaultTransactionStatus) 에서 관리
> 물리 트랜잭션 기준:  ConnectionHolder 나 EntityManager 내부 EntityTransaction


### 왜 즉시 rollback 안하나요?

여러 논리 트랜잭션이 하나의 물리 트랜잭션을 공유하기 때문입니다.

내부에서 즉시 롤백을 해버리면, 외부 로직이 아직 수행 중인데 트랜잭션이 이미 종료되는 문제가 발생합니다.

그래서 즉시 롤백 대신 rollback-only로 마킹해두고, 가장 외부 논리 트랜잭션에서 한 번만 commit/rollback을 결정합니다.

이는 트랜잭션 전파 구조에서 일관성을 유지하기 위한 설계입니다.


### @Transactional이 붙은 메서드에서 예외를 catch로 잡아버리면 어떻게 되나요?

상황에 따라 다르게 동작합니다.

먼저, 내부 트랜잭션에서 발생한 예외를 catch로 잡아서 외부로 전파하지 않으면, 외부 트랜잭션은 정상 흐름으로 판단되어 실제 DB에 커밋이 수행됩니다.
 
반면, 내부 트랜잭션에서 예외가 발생해 rollback-only가 마킹된 상태라면, 상위 트랜잭션에서 예외를 catch하더라도 커밋 시점에 `UnexpectedRollbackException`이 발생할 수 있습니다.


### UnexpectedRollbackException는 어느경우에 발생하나요?

UnexpectedRollbackException은 rollback-only가 마킹된 상태에서, 외부 논리 트랜잭션이 commit을 시도할 때 발생합니다.

주로 내부에서 발생한 예외를 외부에서 catch로 삼켰을 때 나타납니다. 예외를 삼켰으니 외부 입장에서는 정상 흐름으로 인식해 commit을 시도하고, 이 시점에 rollback-only 마킹을 확인해 rollback을 수행한 뒤 `UnexpectedRollbackException`을 던지는 원리입니다.

> AbstractPlatformTransactionManager.processCommit
> Transaction silently rolled back because it has been marked as rollback-only

> 한가지 더 있음. processRolback(..., unexpected=true) 일 경우도 있는데.. 이건 JpaTxManager 말고 DataSourceTxMaanger 일 경우에 해당. 그래서 일단 생각 X 


### 왜 Checked Exception은 기본적으로 롤백이 안 되나요?

Checked Exception은 개발자가 명시적으로 처리를 예상한 예외이기 때문입니다. 예를 들어 파일 없음, 네트워크 실패처럼 복구 가능한 상황을 가정하고 설계된 예외라 반드시 롤백이 필요한 상황은 아니라고 간주합니다.

롤백이 필요하다면 `rollbackFor = Exception.class`처럼 명시적으로 지정해야 합니다.


### rollbackFor와 noRollbackFor는 어떻게 사용하나요?

`rollbackFor`는 기본 롤백 대상이 아닌 예외를 롤백 대상으로 추가하거나, 특정 예외만 롤백하도록 범위를 지정할 때 사용합니다. `noRollbackFor`는 반대로 기본 롤백 대상인 예외를 롤백하지 않도록 제외할 때 사용합니다.


### readOnly = true는 왜 사용하나요?

`readOnly = true`는 조회 전용 트랜잭션임을 명시해 성능을 최적화하기 위해 사용합니다.

JDBC/DB 레벨에서는 Connection.setReadOnly(true)가 호출되어 드라이버나 DB에 읽기 전용 힌트를 전달할 수 있습니다. 다만 이것이 항상 쓰기 차단을 보장하는 것은 아니고, DB/드라이버에 따라 최적화 힌트로만 동작할 수도 있습니다.

JPA/Hibernate 레벨에서는 flush mode를 MANUAL(FlushMode.MANUAL)로 설정되어 자동으로 flush가 발생하지 않습니다. 따라서 Dirty Checking도 수행되지 않아 변경사항이 DB에 반영되지 않습니다.

> Snapshot 은 만들어짐. 단지 커밋 시점에 자동 flush가 일어나지 않으므로, 더티체킹이 일어나지 않고, 결과적으로 update 가 나가지 않는것일 뿐


### @Transactional과 멀티스레드 환경에서 주의할 점이 있나요?

`@Transactional`은 내부적으로 `ThreadLocal`로 트랜잭션 컨텍스트를 관리합니다. 따라서 스레드가 달라지면 같은 트랜잭션을 공유할 수 없습니다. 비동기 처리(`@Async`, `CompletableFuture` 등)와 함께 사용할 때 트랜잭션이 전파되지 않는 점에 유의해야 합니다.


### @Transactional을 클래스에 붙이는 것과 메서드에 붙이는 것의 차이가 있나요?

클래스에 붙이면 해당 클래스의 모든 public 메서드에 트랜잭션이 적용됩니다. 메서드에 붙이면 해당 메서드에만 적용됩니다. 클래스와 메서드 양쪽에 선언된 경우 메서드의 설정이 우선합니다.


### @Transactional(timeout = N)은 어떤 역할을 하나요?

지정한 초(second) 안에 트랜잭션이 완료되지 않으면 강제로 롤백합니다. 장시간 실행되는 쿼리나 데드락 상황에서 무한 대기를 방지하는 용도로 사용합니다.



## @TransactionalEventListener

### @TransactionalEventListener가 뭔가요? 언제 사용하나요?

트랜잭션의 특정 phase에 맞춰 이벤트를 처리하는 리스너입니다. 일반 @EventListener는 이벤트 발행 즉시 실행되지만, @TransactionalEventListener는 트랜잭션의 commit, rollback 등 특정 시점에 맞춰 실행 시점을 제어할 수 있습니다.

내부적으로`TransactionSynchronizationManager`에 동기화 콜백으로 등록되고, 트랜잭션 생명주기에 따라 해당 phase에서 콜백이 실행되는 구조입니다.
 
주로 트랜잭션이 커밋된 이후에 외부 시스템과 연동해야 할 때 사용합니다. 예를 들어 회원 가입 후 이메일 전송처럼, 트랜잭션이 롤백될 수 있는 상황에서 커밋이 확정된 이후에만 외부 작업을 실행해야 정합성이 보장되기 때문입니다.

> 트랜잭션 생명주기: beforeCommit → beforeCompletion → commit/rollback → afterCommtit/afterRollback → afterCompletion


### @TransactionalEventListener에는 어떤 phase 옵션이 있나요?

BEFORE_COMMIT, AFTER_COMMIT, AFTER_ROLLBACK, AFTER_COMPLETION. 총 네가지가 있습니다.

- BEFORE_COMMIT은 외부 논리 트랜잭션 커밋 직전에 호출됩니다.
- AFTER_COMMIT은 외부 논리 트랜잭션 커밋 직후에 호출됩니다. 기본값으로 설정되어있습니다.
- AFTER_ROLLBACK은 외부 논리 트랜잭션 롤백 직후에 호출됩니다.
- AFTER_COMPLETION은 외부 논리 트랜잭션 커밋/롤백 상관없이 트랜잭션 종료 후 호출됩니다.


### 왜 AFTER_COMMIT을 주로 사용하나요?

외부 논리 트랜잭션이 커밋되어 DB에 실제로 반영된 이후에 이벤트를 처리해야 정합성이 보장되기 때문입니다. 커밋 전에 외부 시스템과 연동하면 트랜잭션이 롤백됐을 때 데이터 불일치가 발생할 수 있습니다. AFTER_COMMIT이 기본설정인 이유도 마찬가지입니다.


### 일반 @EventListener랑 뭐가 다른가요?

@EventListener는 이벤트가 발행되는 즉시 실행됩니다. 트랜잭션 컨텍스트와 무관하게 동작하기 때문에, 트랜잭션이 롤백되더라도 이미 실행된 리스너 로직은 되돌릴 수 없습니다.

반면 @TransactionalEventListener는 이벤트 발행 시점에 즉시 실행되지 않고 TransactionSynchronizationManager에 콜백으로 등록되어, 트랜잭션의 특정 phase에 맞춰 실행됩니다. 


### @TransactionalEventListener은 내부적으로 어떻게 동작하나요?

이벤트가 발행되면 즉시 실행되지 않고, `TransactionSynchronizationManager`에 동기화 콜백으로 등록됩니다. 이후 물리 트랜잭션을 처음 생성한 외부 논리 트랜잭션이 종료되는 시점에 설정된 phase에 맞춰 콜백이 실행되는 구조입니다.


### 동기화 콜백은 언제 어떻게 등록되나요?

이벤트가 발행되는 시점에 등록됩니다. 

`ApplicationEventPublisher.publishEvent()`가 호출되면 `TransactionalApplicationListenerMethodAdapter`가 이를 감지하고, `TransactionSynchronizationManager#registerSynchronization`을 호출해 ThreadLocal에 콜백을 저장합니다.

```md
TransactionalApplicationListenerMethodAdapter.onApplicationEvent
  TransactionalApplicationListenerSynchronization#register
    TransactionSynchronizationManager#registerSynchronization
      → 최종적으로 동기화 콜백이 ThreadLocal에 저장
```


### 동기화 콜백은 어떻게 실행되나요?

phase에 따라 두 가지 경로로 나뉩니다.

`BEFORE_COMMIT`은 `processCommit` 내부의 `triggerBeforeCommit` 단계에서 ThreadLocal에 저장된 콜백을 꺼내 실행합니다.

`AFTER_COMMIT`, `AFTER_ROLLBACK`, `AFTER_COMPLETION`은 `processCommit` 또는 `processRollback` 이후 `triggerAfterCompletion` 단계에서 트랜잭션 상태값(`STATUS_COMMITTED`, `STATUS_ROLLED_BACK`)을 기준으로 해당 phase에 맞는 리스너만 선별해서 실행합니다.

> BEFORE_COMMIT 실행시점

```md
# TransactionPhase.BEFORE_COMMIT 만 아래 로직을 탐.

AbstractPlatformTransactionManager.processCommit
AbstractPlatformTransactionManager.triggerBeforeCommit
  TransactionSynchronizationUtils.triggerBeforeCommit
    TransactionalApplicationListenerSynchronization$PlatformSynchronization.beforeCommit
      PlatformSynchronization.processEventWithCallbacks
        → 최종적으로 BEFORE_COMMIT 이벤트 리스너가 실행되는 구조			
```


> AFTER_COMMIT, AFTER_ROLLBACK, AFTER_COMPLETION 실행시점

```md
# TransactionPhase.AFTER_COMMIT, AFTER_ROLLBACK, AFTER_COMPLETION 이 세개가 아래 로직을 탐.

AbstractPlatformTransactionManager.processCommit 또는 processRollback 
AbstractPlatformTransactionManager.triggerAfterCompletion
AbstractPlatformTransactionManager.invokeAfterCompletion
  TransactionSynchronizationUtils.invokeAfterCompletion
    TransactionalApplicationListenerSynchronization$PlatformSynchronization.afterCompletion
	  → phase == TransactionPhase.AFTER_COMMIT && status == STATUS_COMMITTED 
	  → phase == TransactionPhase.AFTER_ROLLBACK && status == STATUS_ROLLED_BACK 
	  → phase == TransactionPhase.AFTER_COMPLETION
		# 위 세 경우만 실행
		PlatformSynchronization.processEventWithCallbacks
		  → 최종적으로 AFTER_COMMIT, AFTER_ROLLBACK, AFTER_COMPLETION 이벤트 리스너가 실행되는 구조
```


### 트랜잭션이 환경에서 이벤트를 발행하면 어떻게 되나요?

기본적으로 실행되지 않습니다. 

내부적으로 현재 스레드에 동기화 콜백을 등록할 수 있는 상태인지, 그리고 실제 물리 트랜잭션이 활성화된 상태인지를 검사하기 때문에, 트랜잭션이 없다면 콜백 자체가 등록 실패하고 리스너가 실행되지 않습니다.

다만 `fallbackExecution = true`로 설정하면 등록 실패 시 즉시 실행됩니다.

```md
TransactionalApplicationListenerMethodAdapter.onApplicationEvent
  TransactionalApplicationListenerSynchronization#register
    TransactionSynchronizationManager#registerSynchronization
      → TransactionSynchronizationManager.isSynchronizationActive == true
      → TransactionSynchronizationManager.isActualTransactionActive == true
      → 경우만 동기화 콜백이 등록됨.
```


### fallbackExecution이 뭔가요? 언제 사용하나요?

활성화된 트랜잭션이 없는 경우에도 리스너가 실행되도록 하는 옵션입니다. 기본값은 `false`로 트랜잭션이 없으면 실행되지 않습니다.

`true`로 설정하면 트랜잭션이 없을 때 즉시 실행됩니다. 트랜잭션이 있는 경우엔 기존에 설정된 phase에 맞춰 실행됩니다.

트랜잭션 유무와 관계없이 항상 실행되어야 하는 로직에 사용하지만, 트랜잭션이 있을 때와 없을 때 동작이 달라질 수 있어 주의가 필요합니다.

```md
TransactionalApplicationListenerMethodAdapter.onApplicationEvent
  TransactionalApplicationListenerSynchronization#register
    TransactionSynchronizationManager#registerSynchronization
      → 동기화 콜백 실패
    → if (this.fallbackExecution) processEvent(event); 로 일반 이벤트리스너와 같이 동작.
```


### AFTER_COMMIT에서 새로운 트랜잭션이 필요하면 어떻게 해야하나요?

`AFTER_COMMIT` 시점은 물리 트랜잭션은 이미 커밋됐지만 논리 트랜잭션 컨텍스트는 아직 정리 중인 상태입니다. 리스너 안에서 DB 작업이 필요하다면 `@Transactional(propagation = REQUIRES_NEW)`를 함께 선언해 새로운 물리 트랜잭션을 생성해야 합니다. 


### AFTER_COMMIT에서 REQUIRED를 사용하면 어떻게 동작하나요?

Spring 6.1부터 `@TransactionalEventListener`에서 기본 전파 속성인 `REQUIRED` 사용을 제한하고 있어, 애플리케이션 시작 시점에 예외가 발생합니다.

이유는 `AFTER_COMMIT` 시점에는 물리 트랜잭션이 이미 종료된 상태임에도 불구하고, 트랜잭션 컨텍스트에 트랜잭션 리소스가 남아있기 때문입니다.

이 때문에 물리 트랜잭션이 없음에도 불구하고 스프링이 트랜잭션이 있다고 판단하게되고, 트랜잭션에 참여하는 형태로 동작하게 됩니다. (새로운 물리 트랜잭션을 만들지 않음.)

그래서 `read 쿼리는 단순 조회로 수행될 수 있지`만 `write 작업은 쿼리는 나갈 수 있되, commit이 수행될 수 없어 실제 DB에 반영되지 않는 문제`가 발생할  수 있습니다.


### 왜 쿼리는 나갈 수 있지만, 실제 DB에 반영되지 않는 문제가 발생하나요?

스프링이 commit을 호출할 수 없는 구조이기 때문입니다.

스프링은 새로운 트랜잭션일 경우에만 commit을 수행하게 됩니다.

하지만 `AFTER_COMMIT` 시점에는 이미 외부 트랜잭션에서 commit이 완료된 상태이기 때문에,  
리스너 내부에서 실행되는 로직은 기존 트랜잭션에 참여하는 것처럼 보일 뿐 실제로는 새로운 트랜잭션이 생성되지 않습니다.

이로 인해 `isNewTransaction()`이 `false`로 판단되어 `doCommit()`이 호출되지 않고,  
결과적으로 쿼리는 실행되더라도 commit이 발생하지 않아 DB에 반영되지 않습니다.


### 왜 read는 왜 되나요?

read 쿼리는 commit 흐름과 무관하게 실행될 수 있기 때문입니다. SELECT는 commit이 필요한 작업이 아니기 때문에, Connection을 통해 쿼리를 실행하고 결과를 조회하는 것은 가능합니다.


### 그럼 격리수준은 보장되나요?

격리수준 보장은 받지 못합니다. AFTER_COMMIT 시점에는 물리 트랜잭션이 이미 종료된 상태이기 때문에, 트랜잭션 경계 없이 실행되어 일관성이나 격리 수준이 적용되지 않습니다.

