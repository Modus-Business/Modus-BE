# Naming Conventions

## 목적
이 문서는 프로젝트 전반에서 사용하는 네이밍 규칙을 정의한다.

목표:
이름만 보고도 이 코드가 무슨 역할인지 바로 이해할 수 있어야 한다.

---

## 기본 원칙
1. 이름은 역할을 드러내야 한다.
2. 축약하지 않는다.
3. 애매한 이름은 사용하지 않는다.
4. 기술 이름보다 비즈니스 의미를 먼저 드러낸다.
5. 주니어 개발자도 이해할 수 있어야 한다.

---

## 파일명 규칙
파일명은 `kebab-case`를 사용한다.

예:

```text
create-user.use-case.ts
login.request.dto.ts
user-profile.controller.ts
typeorm-user.repository.ts
```

---

## 클래스명 규칙
클래스명은 `PascalCase`를 사용한다.

예:
- `CreateUserUseCase`
- `LoginRequestDto`
- `UserProfileController`
- `TypeormUserRepository`

---

## 레이어별 네이밍 규칙

### 1. presentation
형식:
- `[feature].controller.ts`
- `[action].request.dto.ts`
- `[action].response.dto.ts`
- `[purpose].guard.ts`
- `[purpose].pipe.ts`

예:
- `login.controller.ts`
- `login.request.dto.ts`
- `login.response.dto.ts`
- `jwt-auth.guard.ts`
- `validation.pipe.ts`

규칙:
- controller 이름은 기능 또는 API 진입점을 기준으로 짓는다.
- DTO 이름은 반드시 request/response를 구분한다.
- guard, pipe는 목적이 이름에 드러나야 한다.

### 2. application
형식:
- `[action].use-case.ts`
- `[target].application-service.ts`
- `[target].port.ts`
- `[action].command.ts`
- `[action].query.ts`

예:
- `create-user.use-case.ts`
- `issue-access-token.use-case.ts`
- `payment.application-service.ts`
- `payment-gateway.port.ts`
- `find-user-by-email.query.ts`

규칙:
- use-case는 반드시 동사로 시작한다.
- command/query는 수행 목적이 바로 드러나야 한다.
- application service는 use-case를 보조하는 흐름 조합 책임일 때만 사용한다.

### 3. domain
형식:
- `[target].entity.ts`
- `[concept].value-object.ts`
- `[target].repository.ts`
- `[target].domain-service.ts`
- `[rule].policy.ts`

예:
- `user.entity.ts`
- `email.value-object.ts`
- `order.repository.ts`
- `coupon.domain-service.ts`
- `refund.policy.ts`

규칙:
- entity는 비즈니스 개념 이름 그대로 사용한다.
- repository는 추상 계약 이름으로 둔다.
- domain service는 엔티티 하나에 넣기 애매한 도메인 규칙일 때만 사용한다.

### 4. infrastructure
형식:
- `[technology]-[target].repository.ts`
- `[technology]-[target].client.ts`
- `[target].orm-entity.ts`
- `[target].subscriber.ts`

TypeORM 사용 기준 예:
- `typeorm-user.repository.ts`
- `typeorm-order.repository.ts`
- `iamport-payment.client.ts`
- `user.orm-entity.ts`
- `order.subscriber.ts`

규칙:
- 구현체는 어떤 기술을 사용하는지 파일명에서 드러낸다.
- 이 프로젝트는 TypeORM을 사용하므로 repository 구현체 예시는 `typeorm-` 접두사를 기본으로 본다.
- domain entity와 ORM entity는 이름과 파일을 분리한다.

---

## 절대 쓰지 말아야 할 이름
아래 이름은 금지한다.

- `data.service.ts`
- `common.service.ts`
- `util.service.ts`
- `base.service.ts`
- `manager.ts`
- `handler.ts`

이유:
- 책임이 불명확하다.
- 파일이 커질수록 역할이 계속 섞인다.
- 나중에 코드를 찾고 분리하기 어려워진다.

---

## UseCase 네이밍 규칙
use-case 이름은 반드시 동사로 시작한다.

좋은 예:
- `CreateUserUseCase`
- `LoginUserUseCase`
- `CancelOrderUseCase`
- `IssueAccessTokenUseCase`

나쁜 예:
- `UserService`
- `OrderManager`
- `TokenHandler`

규칙:
- 무엇을 수행하는지 이름만 보고 바로 알 수 있어야 한다.
- 단순히 대상만 쓰지 말고 행동을 포함해야 한다.

---

## DTO 네이밍 규칙
DTO는 반드시 request와 response를 구분한다.

형식:
- `[Action]RequestDto`
- `[Action]ResponseDto`

예:
- `LoginRequestDto`
- `LoginResponseDto`
- `UpdateProfileRequestDto`

규칙:
- 요청 DTO와 응답 DTO를 하나로 뭉치지 않는다.
- action 중심 이름으로 목적을 드러낸다.

---

## Repository 네이밍 규칙
인터페이스와 구현체를 분리해서 이름 짓는다.

예:
- `UserRepository` → interface
- `TypeormUserRepository` → implementation

금지:
- `UserRepositoryInterface`

규칙:
- interface는 이미 추상 계약이므로 `Interface`를 붙이지 않는다.
- 구현체는 어떤 기술 기반인지 이름에 드러낸다.

---

## Entity 네이밍 규칙
entity는 비즈니스 개념 이름 그대로 사용한다.

예:
- `User`
- `Order`
- `Product`

파일명 예:
- `user.entity.ts`
- `order.entity.ts`

규칙:
- domain entity는 비즈니스 모델 이름을 따른다.
- DB 테이블 구조용 ORM 모델과 혼동하지 않는다.

---

## Value Object 네이밍 규칙
값 자체가 의미를 가지면 value object로 만든다.

예:
- `Email`
- `Money`
- `OrderStatus`
- `PhoneNumber`

파일명 예:
- `email.value-object.ts`
- `money.value-object.ts`

규칙:
- 단순 타입 래퍼가 아니라 의미와 검증 규칙이 있을 때 VO로 본다.
- 이름은 값의 의미를 그대로 드러내야 한다.

---

## 함수명 규칙
함수명은 동사로 시작하고 목적이 명확해야 한다.

좋은 예:
- `validatePassword()`
- `issueAccessToken()`
- `calculateRefundAmount()`
- `findUserByEmail()`

나쁜 예:
- `process()`
- `handle()`
- `doSomething()`
- `execute()`

규칙:
- 실행 결과나 의도가 이름에서 보여야 한다.
- 너무 넓은 동사는 피한다.

---

## Boolean 네이밍 규칙
Boolean 이름은 질문 형태로 짓는다.

예:
- `isActive`
- `hasPermission`
- `canRefund`
- `shouldRotateToken`

---

## 네이밍 결정 체크리스트
이름을 짓기 전에 아래를 확인한다.

1. 역할이 드러나는가?
2. 다른 후보보다 더 명확한가?
3. 비즈니스 의미가 포함되어 있는가?
4. 주니어가 봐도 이해 가능한가?

---

## 실무에서 자주 하는 실수
아래는 특히 자주 발생하는 실수다.

1. `service`를 너무 많이 붙인다.
2. `handler`를 의미 없이 남발한다.
3. DTO 이름을 대충 짓는다.
4. entity를 DB 모델과 같은 것으로 생각한다.
5. use-case 없이 service 하나에 기능을 몰아넣는다.

---

## TypeORM 기준 추가 원칙
이 프로젝트는 TypeORM을 사용한다.
따라서 아래 구분을 명확히 유지한다.

1. domain entity는 비즈니스 규칙을 담는 모델이다.
2. orm entity는 DB 매핑을 위한 persistence 모델이다.
3. repository interface는 domain 또는 application 경계에 둔다.
4. `Typeorm...Repository`는 infrastructure 구현체다.

예:
- `User` → domain entity
- `UserOrmEntity` → TypeORM entity
- `UserRepository` → repository interface
- `TypeormUserRepository` → repository implementation

---

## 핵심 요약
좋은 네이밍은 설명이 덜 필요한 코드다.

나쁜 네이밍은 주석이나 추가 설명 없이는 역할을 이해하기 어려운 코드다.
