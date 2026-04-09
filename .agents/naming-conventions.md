# Naming Conventions

## 목적
이 문서는 이 프로젝트에서 사용할 네이밍 규칙을 정리한다.

기준은 어렵지 않다.
흔하게 많이 쓰는 NestJS 스타일로, 이름만 봐도 역할이 보이게 한다.

---

## 기본 원칙
1. 파일명은 `kebab-case`
2. 클래스명은 `PascalCase`
3. 함수명은 동사로 시작
4. 애매한 이름은 피한다
5. 복잡한 이름보다 바로 보이는 이름을 우선한다

---

## 기본 파일명 규칙

### module
- `auth.module.ts`
- `user.module.ts`

### controller
- `login.controller.ts`
- `signup.controller.ts`
- `user.controller.ts`

### service
- `login.service.ts`
- `signup.service.ts`
- `user.service.ts`
- `token.service.ts`

### dto
- `signup.request.dto.ts`
- `signup.response.dto.ts`
- `login.request.dto.ts`
- `login.response.dto.ts`

### entity
- `user.entity.ts`
- `refresh-token.entity.ts`

### guard
- `jwt-auth.guard.ts`
- `roles.guard.ts`

### decorator
- `current-user.decorator.ts`

### interface
- `jwt-payload.interface.ts`

### enum
- `user-role.enum.ts`

---

## 클래스명 규칙

### module
- `AuthModule`
- `UserModule`

### controller
- `LoginController`
- `SignupController`
- `UserController`

### service
- `LoginService`
- `SignupService`
- `UserService`
- `TokenService`

### dto
- `SignupRequestDto`
- `SignupResponseDto`
- `LoginRequestDto`
- `LoginResponseDto`

### entity
- `User`
- `RefreshToken`

### guard
- `JwtAuthGuard`
- `RolesGuard`

### enum
- `UserRole`

---

## DTO 네이밍 규칙
DTO는 요청과 응답을 구분한다.

형식:
- `[action].request.dto.ts`
- `[action].response.dto.ts`

예:
- `signup.request.dto.ts`
- `signup.response.dto.ts`
- `login.request.dto.ts`
- `login.response.dto.ts`

---

## Entity 네이밍 규칙
Entity는 TypeORM entity 기준으로 단순하게 간다.

예:
- `user.entity.ts`
- `refresh-token.entity.ts`

클래스명 예:
- `User`
- `RefreshToken`

---

## Service 네이밍 규칙
서비스는 기능 기준으로 이름 짓는다.

예:
- `login.service.ts`
- `signup.service.ts`
- `user.service.ts`

기능이 커져서 분리할 때:
- `token.service.ts`
- `password.service.ts`
- `mail.service.ts`

---

## 피해야 할 이름
아래 이름은 가능하면 쓰지 않는다.

- `common.service.ts`
- `util.service.ts`
- `manager.ts`
- `handler.ts`
- `test2.service.ts`

이유:
- 역할이 안 보인다.
- 파일이 커질수록 더 헷갈린다.

---

## 경로 예시
이 프로젝트는 경로도 단순하고 직관적이어야 한다.

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

기능이 커지면 이렇게 늘릴 수 있다.

```text
src/
  auth/
    auth.module.ts
    decorators/
    enums/
    guards/
    interfaces/
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

## 핵심 요약
이 프로젝트 네이밍 기준은 아래와 같다.

`쉽고, 흔하고, 역할이 바로 보이는 이름으로 간다.`
