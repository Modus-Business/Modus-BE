# Swagger API Overview

현재 Swagger에 등록된 주요 API의 용도를 빠르게 확인하기 위한 문서입니다.

## Auth

### `POST /auth/signup/send-verification`
- 회원가입 전에 이메일 인증 코드를 발송하는 API입니다.
- 아직 계정은 생성되지 않습니다.

### `POST /auth/signup`
- 이메일 인증 코드까지 확인된 뒤 실제 회원가입을 완료하는 API입니다.
- 이름, 이메일, 인증 코드, 역할, 비밀번호를 받아 계정을 생성합니다.

### `POST /auth/login`
- 로그인 API입니다.
- 이메일과 비밀번호를 검증하고 access token, refresh token을 발급합니다.

### `POST /auth/login/refresh`
- refresh token으로 access token과 refresh token을 재발급합니다.
- 리프레시 토큰 회전 전략을 사용합니다.

### `POST /auth/logout`
- 서버에 저장된 refresh token을 만료시키는 로그아웃 API입니다.

## Me

### `GET /me/settings`
- 설정 화면 사용자 정보 조회 API입니다.
- 이름, 이메일, 이메일 인증 상태, 역할을 반환합니다.

## Classes

### `GET /classes`
- 메인 화면 수업 목록 조회 API입니다.
- 학생은 참여 중인 수업과 `myGroup` 정보를 받고, 교사는 자신이 만든 수업과 수업 코드, 학생 수를 받습니다.

### `POST /classes`
- 교사용 수업 생성 API입니다.
- 수업명과 소개를 받아 새 수업과 수업 코드를 생성합니다.

### `PATCH /classes/:classId/code`
- 교사용 수업 코드 재발급 API입니다.
- 본인 수업의 수업 코드를 새 값으로 재발급합니다.

### `POST /classes/join`
- 학생용 수업 참여 API입니다.
- 수업 코드를 입력해 수업에 참여합니다.

## Groups

### `POST /groups`
- 교사용 모둠 생성 API입니다.
- 특정 수업 안에서 모둠명과 학생 목록으로 모둠을 생성합니다.

### `PATCH /groups/:groupId`
- 교사용 모둠 수정 API입니다.
- 모둠명과 학생 목록을 변경합니다.

### `DELETE /groups/:groupId`
- 교사용 모둠 삭제 API입니다.
- 모둠과 연결된 익명 닉네임 정보도 함께 정리합니다.

### `GET /groups/class/:classId`
- 교사용 모둠 목록 조회 API입니다.
- 특정 수업의 모둠 목록과 인원 수를 조회합니다.

### `GET /groups/my/:classId`
- 학생용 내 모둠 조회 API입니다.
- 특정 수업에서 내가 배정된 모둠이 있는지 확인합니다.

### `GET /groups/:groupId`
- 모둠 상세 조회 API입니다.
- 교사는 실명 기준 멤버 목록을 보고, 학생은 익명 닉네임 기준 멤버 목록을 받습니다.

## Notices

### `POST /notices`
- 교사용 공지 작성 API입니다.
- 특정 모둠에 제목과 내용을 가진 공지를 등록합니다.

### `PATCH /notices/:noticeId`
- 교사용 공지 수정 API입니다.
- 본인 수업의 공지만 수정할 수 있습니다.

### `DELETE /notices/:noticeId`
- 교사용 공지 삭제 API입니다.
- 본인 수업의 공지만 삭제할 수 있습니다.

### `GET /notices/group/:groupId`
- 모둠 공지 목록 조회 API입니다.
- 교사와 해당 모둠 학생만 접근할 수 있습니다.

## Assignments

### `POST /assignments/submissions`
- 학생용 결과물 제출 API입니다.
- 파일 URL 또는 링크를 모둠 단위 결과물로 제출합니다.

### `GET /assignments/submissions/my/:groupId`
- 학생용 내 제출 조회 API입니다.
- 현재 내 모둠의 제출 결과물을 확인합니다.

### `GET /assignments/submissions/class/:classId`
- 교사용 수업 제출 현황 조회 API입니다.
- 수업 안 각 모둠의 제출 여부를 한 번에 확인합니다.

## Storage

### `POST /storage/presigned-upload-url`
- S3 업로드용 presigned URL 발급 API입니다.
- 프론트는 이 URL로 파일을 직접 업로드하고, 반환된 `fileUrl`을 제출 API에 사용합니다.

## Survey

### `POST /survey`
- 학생용 설문 제출 API입니다.
- MBTI, 성향, 취향 데이터를 저장하거나 갱신합니다.

### `GET /survey/me`
- 학생용 내 설문 조회 API입니다.
- 현재 로그인한 학생의 설문 데이터를 반환합니다.

## Misc

### `GET /`
- 서버 기본 응답 확인 API입니다.
- 헬스체크 및 기본 연결 확인 용도로 사용합니다.
