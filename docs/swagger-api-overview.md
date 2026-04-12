# Swagger API Overview

Swagger에서 바로 확인해야 하는 주요 흐름만 정리한 문서입니다.

## 공통 응답 구조

### 성공 응답

```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "timestamp": "2026-04-11T12:00:00.000Z",
  "path": "/example"
}
```

### 에러 응답

```json
{
  "success": false,
  "statusCode": 400,
  "message": "잘못된 요청입니다.",
  "error": "Bad Request",
  "timestamp": "2026-04-11T12:00:00.000Z",
  "path": "/example"
}
```

## Auth

### `POST /auth/signup/send-verification`
- 회원가입 전에 이메일 인증 코드를 발송합니다.
- 아직 사용자 계정은 생성되지 않습니다.

### `POST /auth/signup`
- 이메일 인증 코드 검증 후 회원가입을 완료합니다.
- 생성 시점에 `isEmailVerified`는 `true`입니다.

### `POST /auth/login`
- 이메일과 비밀번호로 로그인합니다.
- `accessToken`, `refreshToken`을 함께 발급합니다.

### `POST /auth/login/refresh`
- 리프레시 토큰으로 액세스 토큰을 재발급합니다.

### `POST /auth/logout`
- 리프레시 토큰을 무효화하고 로그아웃 처리합니다.

## Me

### `GET /me/settings`
- 현재 사용자 설정 화면에 필요한 정보를 조회합니다.

## Classes

### `GET /classes`
- 메인 화면 수업 목록을 조회합니다.
- 학생은 참여 중인 수업과 `myGroup` 정보를 받고, 교강사는 자신이 만든 수업과 수업 코드를 받습니다.

### `GET /classes/:classId/participants`
- 교강사용 수업 참가 학생 목록 조회 API입니다.
- 학생 이름, 이메일, 현재 모둠, 클래스 기준 익명 닉네임을 함께 반환합니다.

### `POST /classes`
- 교강사 수업 생성 API입니다.

### `PATCH /classes/:classId/code`
- 교강사 수업 코드 재발급 API입니다.

### `POST /classes/join`
- 학생 수업 참여 API입니다.

## Groups

### `POST /groups`
- 교강사 모둠 생성 API입니다.

### `PATCH /groups/:groupId`
- 교강사 모둠 수정 API입니다.

### `DELETE /groups/:groupId`
- 교강사 모둠 삭제 API입니다.

### `GET /groups/:groupId`
- 모둠 상세 조회 API입니다.
- 교강사는 실명 기준 멤버 목록을 반환합니다.
- 학생은 익명 닉네임 기준 멤버 목록을 반환합니다.
- 학생은 `GET /classes`에서 받은 `myGroup.groupId`로 자신의 모둠을 조회합니다.

## Notices

### `POST /notices`
- 교강사 공지 작성 API입니다.

### `PATCH /notices/:noticeId`
- 교강사 공지 수정 API입니다.

### `DELETE /notices/:noticeId`
- 교강사 공지 삭제 API입니다.

### `GET /notices/group/:groupId`
- 모둠 공지 목록 조회 API입니다.

## Assignments

### `POST /assignments/submissions`
- 학생 결과물 제출 API입니다.
- `fileUrl` 또는 `link`를 제출 데이터로 사용합니다.

### `GET /assignments/submissions/my/:groupId`
- 학생 본인 제출 조회 API입니다.

### `GET /assignments/submissions/class/:classId`
- 교강사 수업별 제출 현황 조회 API입니다.

## Storage

### `POST /storage/presigned-upload-url`
- S3 업로드용 presigned URL 발급 API입니다.
- 프론트는 받은 URL로 직접 업로드한 뒤 반환된 `fileUrl`을 제출 API에 전달합니다.

## Survey

### `POST /survey`
- 학생 설문 제출 API입니다.

### `GET /survey/me`
- 학생 본인 설문 조회 API입니다.

## Misc

### `GET /`
- 서버 기본 응답 확인 API입니다.
