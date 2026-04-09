# Architecture Guide

## 목적
이 문서는 이 프로젝트에서 아키텍처 관련 판단을 할 때 따라야 하는 기준을 정의한다.
특히 NestJS 기반 백엔드에서 레이어드 아키텍처와 도메인 중심 구조를 실제로 어떻게 적용할지 명확하게 설명하는 것이 목적이다.

이 문서는 추상적인 설명용 문서가 아니다.
항상 실제 폴더 구조, 파일 책임, 레이어 경계 기준까지 포함해서 판단해야 한다.

---

## 핵심 구조 원칙
이 프로젝트는 아래 순서로 구조를 설계한다.

1. 도메인 기준으로 먼저 나눈다.
2. 도메인 내부를 하위 기능 단위로 세분화한다.
3. 각 하위 기능 내부에서 레이어를 분리한다.

즉, 항상 아래 순서로 사고한다.

`domain → sub-feature → layer`

---

## 기본 디렉터리 구조 기준
구조를 제안하거나 파일을 만들 때는 아래 형태를 기본 기준으로 삼는다.

```text
src/
  main.ts
  app.module.ts

  common/
    exception/
    interceptor/
    decorator/
    logger/
    utils/

  domains/
    user/
      auth/
        presentation/
        application/
        domain/
        infrastructure/

      profile/
        presentation/
        application/
        domain/
        infrastructure/

      permission/
        presentation/
        application/
        domain/
        infrastructure/

    order/
      creation/
        presentation/
        application/
        domain/
        infrastructure/

      payment/
        presentation/
        application/
        domain/
        infrastructure/

      cancel/
        presentation/
        application/
        domain/
        infrastructure/

    product/
      catalog/
        presentation/
        application/
        domain/
        infrastructure/

      inventory/
        presentation/
        application/
        domain/
        infrastructure/

      price/
        presentation/
        application/
        domain/
        infrastructure/
```

구조를 설명할 때도 반드시 이 순서가 드러나야 한다.

---

## 레이어 역할 정의

### 1. presentation
역할:
외부 요청과 응답을 처리하는 레이어다.

포함 대상:
- controller
- request dto
- response dto
- guard
- interceptor
- pipe

규칙:
- 비즈니스 로직을 넣지 않는다.
- 요청 검증, 인증/인가, 입력 변환, 응답 포맷 조정까지만 담당한다.
- 실제 기능 실행은 application 레이어에 위임한다.

### 2. application
역할:
유스케이스를 실행하고 흐름을 조합하는 레이어다.

포함 대상:
- use-case
- application service
- command / query
- port(interface)

규칙:
- 기능 실행 순서를 조합한다.
- domain 객체와 domain 서비스를 사용한다.
- DB, ORM, 외부 API 같은 기술 구현 세부사항을 직접 알면 안 된다.

### 3. domain
역할:
비즈니스 규칙의 핵심을 담는 레이어다.

포함 대상:
- entity
- value object
- repository interface
- domain service
- policy

규칙:
- 가장 중요한 비즈니스 규칙은 여기에 둔다.
- 외부 프레임워크, DB, HTTP, ORM 구현을 몰라야 한다.
- 가능한 한 순수한 객체와 규칙으로 유지한다.

### 4. infrastructure
역할:
기술 구현을 담당하는 레이어다.

포함 대상:
- repository 구현체
- ORM entity / schema
- 외부 API client
- persistence adapter

규칙:
- domain/application이 정의한 인터페이스를 구현한다.
- 기술 세부 구현은 이 레이어에 격리한다.

---

## 의존성 방향
허용되는 의존성은 아래와 같다.

- presentation → application
- application → domain
- infrastructure → domain, application

금지되는 의존성은 아래와 같다.

- domain → infrastructure
- domain → presentation
- application → presentation

핵심 원칙:
`domain`은 가장 안쪽에 있는 순수한 레이어여야 한다.

---

## 도메인 분리 기준
도메인을 나눌 때는 아래 질문으로 판단한다.

1. 비즈니스 목적이 다른가?
2. 변경 주기가 다른가?
3. 책임이 다른가?
4. 외부 의존성이 다른가?

이 기준이 다르면 같은 폴더에 억지로 묶지 않는다.

---

## 하위 기능 분리 기준
하나의 도메인 안에서도 아래 기준으로 하위 기능을 분리한다.

1. 기능이 독립적으로 동작 가능한가?
2. API를 분리할 수 있는가?
3. 변경이 따로 일어나는가?

예:

```text
user/
  auth/
  profile/
  permission/
  settings/
```

---

## 공통 모듈 분리 기준
아무거나 `common`으로 빼지 않는다.

공통으로 빼는 조건은 아래와 같다.

1. 2곳 이상에서 사용된다.
2. 의미가 완전히 동일하다.
3. 분리했을 때 오히려 더 이해하기 쉽다.

예:
- exception
- logger
- auth decorator

---

## 반드시 구분해야 하는 개념

### domain entity vs ORM entity
- domain entity: 비즈니스 모델
- ORM entity: DB 구조

절대 같은 것으로 취급하지 않는다.

### use-case vs service
- use-case: 하나의 기능 실행 단위
- service: 보조 로직 또는 여러 유스케이스를 돕는 구성 요소

### repository interface vs implementation
- interface: domain 또는 application이 정의한 추상 계약
- implementation: infrastructure가 제공하는 실제 구현

---

## 과분리 경고
아래 상태라면 구조가 과하게 쪼개졌을 가능성이 높다.

1. 폴더만 많고 실제 로직이 거의 없다.
2. 항상 같이 수정되는 코드가 불필요하게 떨어져 있다.
3. 책임 경계가 오히려 더 모호하다.
4. 어디를 수정해야 할지 찾기 어렵다.

핵심 기준:
주니어 개발자도 유지보수 가능한 구조여야 한다.

---

## 추천 개발 흐름
기능 구현 시 아래 순서를 우선으로 본다.

1. 도메인 정의
2. 하위 기능 분리
3. use-case 정의
4. domain 모델 정의
5. infrastructure 구현

---

## 기능 추가 체크리스트
새 기능이나 파일을 추가하기 전에 아래를 확인한다.

1. 어느 도메인인가?
2. 기존 하위 기능에 속하는가, 새 하위 기능인가?
3. 어느 레이어 책임인가?
4. domain이 오염되지 않았는가?
5. 공통화가 필요한가?

---

## 절대 하지 말 것
1. controller에 비즈니스 로직 넣기
2. service 하나에 모든 책임 몰아넣기
3. entity를 DB 모델과 동일하게 취급하기
4. 레이어를 섞어서 구현하기
5. 구조 판단 없이 바로 코딩하기

---

## 핵심 요약
이 프로젝트 구조의 핵심은 아래 두 문장이다.

`도메인 → 기능 → 레이어`

그리고

`domain은 절대 더럽히지 마라`
