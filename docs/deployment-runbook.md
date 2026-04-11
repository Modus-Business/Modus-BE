# Deployment Runbook

Modus 백엔드 서버 배포 및 재시작 절차입니다.

## 기본 경로

```bash
cd /home/ubuntu/Modus-BE
```

## 배포 순서

1. 현재 상태 확인

```bash
git status
```

2. 최신 코드 반영

```bash
git pull origin main
```

3. 의존성 설치

```bash
pnpm install
```

4. 빌드

```bash
pnpm build
```

5. 마이그레이션 적용

```bash
pnpm typeorm migration:run
```

6. PM2 재시작

```bash
pm2 restart all
pm2 list
```

## 점검 항목

- `git status`가 깨끗한지 확인
- `pnpm build`가 에러 없이 끝났는지 확인
- 마이그레이션이 추가된 배포라면 `migration:run` 결과 확인
- `pm2 list`에서 프로세스가 `online` 상태인지 확인
- Swagger 반영 확인 시 브라우저에서 강력 새로고침 사용

## 자주 발생하는 문제

### `git pull`이 안 되는 경우
- 서버에 로컬 변경 사항이 남아 있는 경우가 많습니다.
- 먼저 `git status`와 `git diff`로 변경 파일을 확인합니다.

### 빌드는 됐는데 반영이 안 되는 경우
- `pm2 restart all`을 하지 않았거나 다른 경로의 앱이 떠 있을 수 있습니다.
- `pm2 describe <app-name>`으로 `script path`, `cwd`를 확인합니다.

### SSH 접속이 타임아웃되는 경우
- EC2 보안 그룹의 `22/tcp` 인바운드 원본 IP가 현재 공인 IP와 다를 가능성이 큽니다.
- 보안 그룹에서 `SSH` 원본을 현재 공인 IP `/32`로 수정합니다.
