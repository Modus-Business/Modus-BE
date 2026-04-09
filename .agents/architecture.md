# Architecture Guide

## 목적
이 문서는 이 프로젝트에서 사용할 구조 기준을 정리한다.

이 프로젝트는 복잡한 레이어드 아키텍처를 억지로 도입하지 않는다.
대신 NestJS에서 흔하게 많이 쓰는 단순한 구조를 사용하고, 큰 기능 아래를 실제 기능 단위로 세분화해서 개발한다.

핵심은 아래와 같다.

1. 큰 기능 폴더를 만든다.
2. 그 안을 실제 기능 단위로 다시 나눈다.
3. 각 기능 폴더 안에는 필요한 파일만 둔다.
4. `module / controller / service / dto / entities` 중심으로 간다.
5. 필요할 때만 `services / guards / decorators / interfaces / enums / utils`를 추가한다.

---

## 기본 구조 기준
이 프로젝트는 아래 같은 방향으로 간다.

```text
src/
  auth/
    auth.module.ts
    login/
      dto/
      login.controller.ts
      login.service.ts
    signup/
      dto/
      entities/
      signup.controller.ts
      signup.service.ts
```

즉, `auth` 같은 큰 기능 아래를 `login`, `signup`처럼 실제 기능별로 나누고, 각 기능 안은 단순하게 유지한다.

---

## 기본 원칙
1. `presentation / application / domain / infrastructure` 같은 폴더는 사용하지 않는다.
2. `domain` 같은 이름을 파일이나 폴더에 억지로 넣지 않는다.
3. `auth.service.ts` 하나에 로그인, 회원가입, 토큰, 비밀번호 로직을 전부 몰아넣지 않는다.
4. 그렇다고 처음부터 너무 잘게 쪼개지도 않는다.
5. 수정 위치를 빨리 찾을 수 있는 구조를 우선한다.

---

## 폴더 구성 기준
기능 폴더 안에서 사용할 수 있는 대표 폴더는 아래와 같다.

- `dto`
- `entities`
- `services`
- `guards`
- `decorators`
- `interfaces`
- `enums`
- `utils`

중요:
- 위 폴더를 다 만들 필요는 없다.
- 실제로 필요할 때만 만든다.

---

## 파일 역할 기준

### `*.module.ts`
- 큰 기능을 묶는 파일이다.
- 보통 상위 기능 폴더에 둔다.

예:
- `auth.module.ts`
- `user.module.ts`

### `*.controller.ts`
- HTTP 요청을 받는 진입점이다.
- 요청을 받고 service를 호출한다.
- controller에는 비즈니스 로직을 많이 넣지 않는다.

예:
- `login.controller.ts`
- `signup.controller.ts`
- `profile.controller.ts`

### `*.service.ts`
- 해당 기능의 핵심 로직을 처리한다.
- 이 프로젝트에서는 `use-case` 대신 service 중심으로 간다.
- 서비스 이름도 기능 기준으로 나눈다.

예:
- `login.service.ts`
- `signup.service.ts`
- `token.service.ts`
- `password.service.ts`

### `dto/`
- 요청 DTO, 응답 DTO를 둔다.
- API 입력/출력 구조를 명확하게 관리한다.

예:
- `login.request.dto.ts`
- `login.response.dto.ts`
- `signup.request.dto.ts`
- `signup.response.dto.ts`

### `entities/`
- TypeORM entity를 둔다.
- DB 테이블과 직접 연결되는 모델이다.

예:
- `user.entity.ts`
- `refresh-token.entity.ts`

중요:
- 지금은 TypeORM entity 중심으로 단순하게 간다.
- `domain entity`, `orm entity` 이중 구조는 강제하지 않는다.

### `services/`
- 하나의 기능 폴더 안에서 서비스가 다시 나뉘기 시작할 때만 만든다.

예:
- `login.service.ts`
- `token.service.ts`
- `signup.service.ts`
- `password.service.ts`

### `guards/`
- 인증/인가 guard가 필요할 때만 만든다.

예:
- `jwt-auth.guard.ts`
- `roles.guard.ts`

### `decorators/`
- 커스텀 데코레이터가 필요할 때만 만든다.

예:
- `current-user.decorator.ts`
- `roles.decorator.ts`

### `interfaces/`
- 타입 계약이 필요할 때만 만든다.

예:
- `jwt-payload.interface.ts`

### `enums/`
- 역할, 상태값처럼 고정된 값 묶음이 필요할 때만 만든다.

예:
- `user-role.enum.ts`

### `utils/`
- 해당 기능 안에서만 쓰는 유틸을 둔다.
- 전역 공통이면 `common/utils`로 뺀다.

---

## 구조 예시

### 추천 auth 구조
```text
src/
  auth/
    auth.module.ts
    login/
      dto/
        login.request.dto.ts
        login.response.dto.ts
      login.controller.ts
      login.service.ts
    signup/
      dto/
        signup.request.dto.ts
        signup.response.dto.ts
      entities/
        user.entity.ts
      signup.controller.ts
      signup.service.ts
```

### 기능이 더 커졌을 때
```text
src/
  auth/
    auth.module.ts
    enums/
      user-role.enum.ts
    guards/
      jwt-auth.guard.ts
    interfaces/
      jwt-payload.interface.ts
    login/
      dto/
      services/
        login.service.ts
        token.service.ts
      login.controller.ts
    signup/
      dto/
      entities/
      services/
        signup.service.ts
        password.service.ts
      signup.controller.ts
```

---

## 분리 기준
처음부터 복잡하게 나누지 않는다.
하지만 기능 경계가 분명하면 `login`, `signup`처럼 나누는 것은 기본으로 본다.

아래 상황이면 한 번 더 분리한다.

1. `auth` 안에서 로그인과 회원가입 책임이 분명히 다를 때
2. `login.service.ts` 안에 토큰 로직까지 몰릴 때
3. `signup.service.ts` 안에 비밀번호 처리 로직이 과도하게 커질 때
4. 파일을 찾기 어려워질 때
5. 한 파일이 너무 길어질 때

즉, 기준은 아래와 같다.

- 큰 기능 아래는 실제 기능별로 나눈다
- 각 기능 안은 처음엔 단순하게 둔다
- 그 안이 커지면 다시 세부 폴더를 추가한다

---

## 공통화 기준
아무거나 `common`으로 빼지 않는다.

공통으로 빼는 조건:
1. 두 군데 이상에서 사용한다.
2. 의미가 완전히 같다.
3. 빼는 것이 더 읽기 쉽다.

예:
- 공통 예외 처리
- 공통 로거
- 공통 유틸

---

## 하지 말아야 할 것
1. 필요 없는 상위 폴더 만들기
2. `presentation`, `application`, `domain`, `infrastructure` 같은 폴더를 억지로 도입하기
3. 파일이 거의 없는데 폴더만 많이 만들기
4. 구조가 있어 보이려고 복잡하게 만들기
5. `auth.service.ts` 하나에 로그인, 회원가입, 토큰, 비밀번호 로직을 전부 몰아넣기

---

## 핵심 요약
이 프로젝트는 아래 방향으로 간다.

`큰 기능 아래를 login / signup 같은 실제 기능으로 나누고, 각 기능 안은 단순하게 유지한다`
