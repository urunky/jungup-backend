# Cloudflare Tunnel 설정 가이드

## 설치 완료
✅ cloudflared가 설치되었습니다.

## 사용 방법

### 새 PowerShell 창에서 실행
```powershell
# 1. 새 PowerShell 창 열기
# 2. 프로젝트 디렉토리로 이동
cd C:\Users\urunk\urunky\Outsourcing\2025\jungup\flow-backend

# 3. Cloudflare Tunnel 시작
cloudflared tunnel --url http://172.30.1.73:3000
```

### 결과
- 자동으로 HTTPS URL 생성됨 (예: `https://random-word.trycloudflare.com`)
- 무료, 인증 불필요
- 터널 종료 시까지 URL 유지

## 장점
- ✅ 무료
- ✅ 인증 불필요 (quick tunnel 모드)
- ✅ ngrok보다 안정적
- ✅ 브라우저 경고 없음

## 현재 서버
- HTTP 서버: http://172.30.1.73:3000
- Node.js 서버가 실행 중이어야 함

## 빠른 시작
새 PowerShell 창을 열고:
```powershell
cloudflared tunnel --url http://172.30.1.73:3000
```

터미널에 표시되는 `https://...trycloudflare.com` URL을 사용하세요.
