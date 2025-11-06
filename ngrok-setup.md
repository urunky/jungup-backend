# HTTPS 리버스 프록시 설정 가이드

## ngrok 사용 방법 (가장 간단)

### 1. ngrok 설치

```bash
# Chocolatey 사용
choco install ngrok

# 또는 https://ngrok.com/download 에서 다운로드
```

### 2. ngrok 실행

```bash
# HTTP 서버를 HTTPS로 노출
ngrok http 172.30.1.73:3000
```

### 3. 결과

- ngrok이 자동으로 HTTPS URL 생성 (예: https://abc123.ngrok.io)
- 무료 버전: 랜덤 URL, 세션 종료시 URL 변경
- 유료 버전: 고정 도메인 가능

---

## Caddy 사용 방법 (운영 환경 권장)

### 1. Caddy 설치

```bash
# Chocolatey 사용
choco install caddy
```

### 2. Caddyfile 생성

프로젝트 루트에 `Caddyfile` 생성:

```
yourdomain.com {
    reverse_proxy 172.30.1.73:3000
}
```

### 3. Caddy 실행

```bash
caddy run
```

### 특징

- Let's Encrypt 인증서 자동 발급/갱신
- 도메인 필요
- 운영 환경에 적합

---

## 현재 서버 상태

- HTTP 서버: http://172.30.1.73:3000
- HTTPS 접속을 위해 위의 방법 중 하나 선택

## 빠른 테스트 (ngrok)

```bash
ngrok http 172.30.1.73:3000
```
