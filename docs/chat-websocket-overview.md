# Chat WebSocket Overview

실시간 채팅은 `/chat` 네임스페이스의 Socket.IO 게이트웨이로 동작합니다.

## 핵심 규칙

- 메시지는 항상 `nickname`, `content`, `sentAt`을 포함합니다.
- 사용자는 먼저 `chat.join` 이벤트로 그룹 채팅방에 입장해야 합니다.
- `chat.send`는 `chat.join` 이후에만 허용됩니다.
- 채팅방 식별자는 별도 `roomId`가 아니라 기존 `groupId`를 그대로 사용합니다.
- 닉네임은 클라이언트가 보내지 않고 서버가 JWT와 그룹 정보로 결정합니다.
- 최근 메시지 50개를 입장 직후 `chat.history`로 내려줍니다.
- WebSocket CORS는 `CORS_ORIGIN`에 포함된 origin만 허용합니다.

## 연결

```text
ws://<host>/chat
```

- handshake `auth.token` 또는 `Authorization: Bearer <accessToken>` 헤더로 인증합니다.

## 클라이언트 -> 서버

### `chat.join`

```json
{
  "groupId": "11111111-1111-1111-1111-111111111111"
}
```

### `chat.send`

```json
{
  "content": "안녕하세요"
}
```

## 서버 -> 클라이언트

### `chat.joined`

```json
{
  "groupId": "11111111-1111-1111-1111-111111111111",
  "nickname": "조용한 고래",
  "joinedAt": "2026-04-12T12:00:00.000Z"
}
```

### `chat.history`

```json
[
  {
    "messageId": "uuid",
    "groupId": "11111111-1111-1111-1111-111111111111",
    "nickname": "조용한 고래",
    "content": "이전 메시지",
    "sentAt": "2026-04-12T12:00:00.000Z"
  }
]
```

### `chat.message`

```json
{
  "messageId": "uuid",
  "groupId": "11111111-1111-1111-1111-111111111111",
  "nickname": "조용한 고래",
  "content": "안녕하세요",
  "sentAt": "2026-04-12T12:01:00.000Z"
}
```

### `chat.error`

`chat.join`, `chat.send` 처리 중 발생한 오류는 `chat.error` 이벤트로 전달됩니다.

```json
{
  "success": false,
  "statusCode": 400,
  "message": "error message",
  "error": "Bad Request",
  "timestamp": "2026-04-12T12:01:00.000Z",
  "event": "chat.send"
}
```

### `connect_error`

연결 단계의 인증 실패 또는 CORS 거부는 Socket.IO `connect_error`로 전달됩니다.

## 저장 구조

`chat_messages`

- `message_id`
- `group_id`
- `sender_user_id`
- `nickname`
- `content`
- `sent_at`

## 적용 순서

1. `pnpm install`
2. `pnpm typeorm migration:run`
3. 클라이언트에서 `/chat` 연결
4. `chat.join`
5. `chat.send`
