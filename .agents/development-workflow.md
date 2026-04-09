# Development Workflow

## 목적
이 문서는 이 프로젝트에서 기능을 만들 때 어떤 순서로 생각하고 구현할지 정리한다.

이 프로젝트는 복잡한 설계 문서식 흐름보다, 실제로 빠르게 만들고 관리하기 쉬운 흐름을 우선한다.

---

## 기본 흐름
보통 아래 순서로 작업한다.

1. 어떤 큰 기능인지 정한다.
2. 그 안에서 어떤 세부 기능인지 정한다.
3. 해당 기능 폴더를 만든다.
4. 필요한 파일만 만든다.
5. 먼저 동작하게 만든다.
6. 커지면 그때 더 분리한다.

---

## 기능 만들기 전 확인할 것
코드 쓰기 전에 아래를 먼저 본다.

1. 이 기능은 `auth`, `user`, `order` 중 어디에 들어가는가?
2. 그 안에서 `login`, `signup`, `profile`처럼 어떤 세부 기능인가?
3. 지금 당장 필요한 파일이 무엇인가?
4. `controller / service / dto / entity` 정도면 충분한가?
5. 굳이 폴더를 더 나눌 이유가 있는가?
6. 요구사항이 애매한가?

---

## 질문해야 하는 상황
아래 상황이면 먼저 질문한다.

1. 요구사항이 애매할 때
2. 기능 위치가 애매할 때
3. API 형식이 안 정해졌을 때
4. DB 컬럼 구성이 안 정해졌을 때
5. 로그인 흐름이나 권한 정책이 안 정해졌을 때
6. 이름 후보가 여러 개일 때

---

## 추천 구현 순서

### 1. 큰 기능 폴더 정하기
예:
- 로그인/회원가입 → `src/auth`
- 사용자 정보 → `src/user`

### 2. 세부 기능 폴더 정하기
예:
- 로그인 → `src/auth/login`
- 회원가입 → `src/auth/signup`
- 프로필 → `src/user/profile`

### 3. 기본 파일 만들기
보통 아래처럼 시작한다.

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

### 4. 필요한 DTO 만들기
예:
- `signup.request.dto.ts`
- `signup.response.dto.ts`
- `login.request.dto.ts`
- `login.response.dto.ts`

### 5. Entity 만들기
예:
- `user.entity.ts`

### 6. Service에 기능 구현
기능별 service에 구현한다.

예:
- `login.service.ts`
- `signup.service.ts`

### 7. Controller에서 연결
각 기능 controller에서 요청을 받고 service를 호출한다.

---

## 분리 기준
처음부터 세세하게 나누지 않는다.
하지만 서로 다른 기능은 처음부터 폴더를 나눠둔다.

아래 상황이면 한 번 더 분리한다.

1. 하나의 기능 폴더 안에서 service 파일이 너무 커질 때
2. 토큰 처리, 비밀번호 처리처럼 역할이 확실히 갈릴 때
3. 파일을 찾기 어려워질 때

그때 예를 들어 이렇게 바꿀 수 있다.

```text
src/
  auth/
    auth.module.ts
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

## 구현 중 체크리스트
구현하면서 아래를 계속 본다.

1. 지금 폴더가 너무 과한가?
2. 필요 없는 폴더를 만들고 있지 않은가?
3. `auth` 아래 기능 구분이 필요한데 하나로 뭉쳐놓고 있지 않은가?
4. controller에 로직을 너무 많이 넣고 있지 않은가?
5. service 하나에 너무 많은 책임이 몰리고 있지 않은가?
6. DTO와 entity 역할이 섞이지 않았는가?

---

## 구현 후 체크리스트
구현 후에는 아래를 본다.

1. 파일 위치가 직관적인가?
2. 이름이 역할을 잘 드러내는가?
3. 처음 보는 사람도 수정 위치를 바로 찾을 수 있는가?
4. `auth/login`, `auth/signup`처럼 기능별로 잘 나뉘어 있는가?
5. 지금 구조가 과하지 않은가?
6. 나중에 분리하기 쉬운 구조인가?

---

## 하지 말아야 할 것
1. 처음부터 너무 복잡한 레이어 구조 만들기
2. 필요 없는 상위 폴더 만들기
3. 파일이 거의 없는데 폴더만 많이 만들기
4. 있어 보이려고 구조를 복잡하게 만들기
5. 서로 다른 기능을 서비스 하나에 전부 몰아넣기

---

## 핵심 요약
이 프로젝트에서는 아래 흐름으로 간다.

`큰 기능 정하기 → 세부 기능 정하기 → 필요한 파일만 만들기 → 먼저 동작하게 만들기 → 커지면 분리하기`
