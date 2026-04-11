# File Upload Flow

과제 제출 파일 업로드의 실제 사용 흐름입니다.

## 백엔드 기준 흐름

1. 로그인 후 `accessToken` 확보
2. `POST /storage/presigned-upload-url` 호출
3. 응답으로 `uploadUrl`, `fileUrl`, `fileKey` 수신
4. 프론트가 `uploadUrl`로 S3에 직접 `PUT`
5. 업로드 성공 후 `POST /assignments/submissions` 호출
6. `fileUrl`을 제출 데이터로 저장
7. 이후 조회 API에서 동일한 `fileUrl` 확인

## 1. Presigned URL 발급

### 요청

```http
POST /storage/presigned-upload-url
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "fileName": "team-result.pdf",
  "contentType": "application/pdf",
  "purpose": "assignments"
}
```

### 응답

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "fileKey": "assignments/2026/04/11/user-id-1712800000000-team-result.pdf",
    "fileUrl": "https://bucket.s3.ap-northeast-2.amazonaws.com/assignments/2026/04/11/user-id-1712800000000-team-result.pdf",
    "uploadUrl": "https://bucket.s3.ap-northeast-2.amazonaws.com/assignments/2026/04/11/user-id-1712800000000-team-result.pdf?...",
    "expiresInSeconds": 300
  },
  "timestamp": "2026-04-11T12:00:00.000Z",
  "path": "/storage/presigned-upload-url"
}
```

## 2. S3 직접 업로드

```http
PUT <uploadUrl>
Content-Type: application/pdf

<binary file>
```

- 이 단계는 브라우저 또는 앱에서 직접 S3로 업로드합니다.
- 업로드 성공 시 보통 HTTP `200` 또는 `204`를 받습니다.

## 3. 과제 제출 API 호출

### 요청

```http
POST /assignments/submissions
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "groupId": "11111111-1111-1111-1111-111111111111",
  "fileUrl": "https://bucket.s3.ap-northeast-2.amazonaws.com/assignments/2026/04/11/user-id-1712800000000-team-result.pdf"
}
```

### 검증 규칙

- `fileUrl` 또는 `link` 중 하나는 반드시 있어야 합니다.
- `fileUrl`은 스토리지 업로드 API가 발급한 URL이어야 합니다.
- `fileUrl`의 경로는 반드시 `/assignments/...` 이어야 합니다.

즉, 임의의 외부 파일 URL은 과제 제출용 `fileUrl`로 저장할 수 없습니다.

## 4. 조회 확인

### 학생용
- `GET /assignments/submissions/my/:groupId`

### 교사용
- `GET /assignments/submissions/class/:classId`

## 운영 체크포인트

- `AWS_S3_BUCKET`, `AWS_REGION` 설정 확인
- 공개 파일 URL을 별도 도메인으로 쓸 계획이면 `AWS_S3_PUBLIC_BASE_URL` 설정
- 버킷이 private이면 `fileUrl` 공개 접근 정책 또는 CloudFront 전략 필요

## 현재 백엔드 보장 사항

- 업로드 URL 발급 가능
- 업로드 후 `assignments` 경로 파일만 과제 제출에 허용
- 학생 본인 모둠만 제출 가능
- 교사는 수업별 제출 현황 조회 가능
