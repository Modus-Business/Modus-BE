# Swagger API Overview

현재 Swagger에 등록된 주요 API와 용도를 빠르게 확인하기 위한 문서입니다.

## Auth

### `POST /auth/signup`
- 로컬 회원가입 API입니다.
- 이름, 이메일, 비밀번호, 역할을 받아 사용자 계정을 생성합니다.

### `POST /auth/login`
- 로그인 API입니다.
- 이메일과 비밀번호를 검증하고 access token, refresh token을 발급합니다.

### `POST /auth/login/refresh`
- refresh token으로 access token과 refresh token을 재발급하는 API입니다.
- RFR 구조의 토큰 rotation 흐름을 담당합니다.

### `POST /auth/logout`
- 서버에 저장된 refresh token을 폐기하는 로그아웃 API입니다.

## Me

### `GET /me/settings`
- 현재 로그인한 사용자의 설정 화면용 기본 정보를 조회합니다.
- 이름, 이메일, 이메일 인증 상태, 역할을 반환합니다.

## Classes

### `GET /classes`
- 메인 화면 수업 목록 조회 API입니다.
- 학생은 참여한 수업과 `myGroup` 정보를 받고, 교강사는 만든 수업과 수업 코드/학생 수를 받습니다.

### `POST /classes`
- 교강사 수업 생성 API입니다.
- 수업명과 소개를 받아 새 수업을 만들고 팀코드 역할의 수업 코드를 자동 생성합니다.

### `POST /classes/:classId/code/regenerate`
- 교강사 수업 코드 재발급 API입니다.
- 본인 수업에 한해서 새 랜덤 수업 코드로 교체합니다.

### `POST /classes/join`
- 수강생 수업 참여 API입니다.
- 수업 코드를 입력해 수업에 참여합니다.

## Groups

### `POST /groups`
- 교강사 모둠 생성 API입니다.
- 특정 수업 안에서 모둠명을 정하고 학생 목록을 배정합니다.

### `GET /groups/class/:classId`
- 교강사 모둠 목록 조회 API입니다.
- 특정 수업에 속한 모둠 목록과 인원 수를 조회합니다.

### `GET /groups/my/:classId`
- 수강생 내 모둠 조회 API입니다.
- 특정 수업에서 내가 배정된 모둠이 있는지 확인합니다.

### `GET /groups/:groupId`
- 모둠 상세 조회 API입니다.
- 교강사는 실명 기준 멤버 목록을 보고, 수강생은 익명 표시명 기준 멤버 목록을 봅니다.

## Notices

### `POST /notices`
- 교강사 공지 작성 API입니다.
- 특정 모둠에 제목/내용 형태의 공지를 등록합니다.

### `PATCH /notices/:noticeId`
- 교강사 공지 수정 API입니다.
- 본인 수업 모둠의 공지 제목과 내용을 수정합니다.

### `DELETE /notices/:noticeId`
- 교강사 공지 삭제 API입니다.
- 본인 수업 모둠의 공지를 삭제합니다.

### `GET /notices/group/:groupId`
- 모둠 공지 목록 조회 API입니다.
- 교강사 또는 해당 모둠 수강생만 접근할 수 있습니다.

### `GET /notices/group/:groupId/latest`
- 모둠 최신 공지 조회 API입니다.
- 가장 최근 공지 1건을 빠르게 불러올 때 사용합니다.

## Assignments

### `POST /assignments/submissions`
- 수강생 결과물 제출 API입니다.
- 파일 URL 또는 링크를 모둠 단위 결과물로 제출합니다.

### `GET /assignments/submissions/my/:groupId`
- 수강생 내 모둠 제출 조회 API입니다.
- 현재 내 모둠이 제출한 결과물을 확인합니다.

### `GET /assignments/submissions/group/:groupId`
- 교강사 모둠 단위 제출 여부 조회 API입니다.
- 특정 모둠이 제출했는지와 제출 정보를 확인합니다.

### `GET /assignments/submissions/class/:classId`
- 교강사 수업 단위 제출 여부 조회 API입니다.
- 수업 안의 각 모둠 제출 여부를 한 번에 확인합니다.

## Survey

### `POST /survey`
- 수강생 설문 제출 API입니다.
- MBTI, 성향, 취향 데이터를 저장하거나 기존 설문을 업데이트합니다.

### `GET /survey/me`
- 수강생 내 설문 조회 API입니다.
- 현재 로그인한 수강생의 설문 데이터를 반환합니다.

## Misc

### `GET /`
- 서버 기본 응답 확인용 API입니다.
- 보통 헬스체크나 초기 연결 확인 용도로 사용됩니다.
