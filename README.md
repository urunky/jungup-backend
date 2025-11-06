# Flow-backend

Node.js + SQLite CRUD service example

Setup

1. Install dependencies

```powershell
npm install
```

2. Start server

```powershell
npm start
```

API

- GET / -> health
- GET /items -> list items
- POST /items -> create { name, description }
- GET /items/:id -> get item
- PUT /items/:id -> update { name, description }
- DELETE /items/:id -> delete

Tests

```powershell
npm test
```

Accessing from another machine

- The server now binds to the HOST env var (default 0.0.0.0). To start and bind to all interfaces:

```powershell
$env:HOST='0.0.0.0'; npm start
```

- Then from another device on the same LAN, open http://<YOUR_MACHINE_IP>:3000 (replace 3000 if you set PORT).

# 핵심 플로우

시작화면 → 게스트 세션 자동 발급 →

프로파일 입력(나이·체류시간·흥미) →

추천 동선 표시(지도+리스트, 목표점수/예상시간) →

전시물 도착 후 QR 스캔 →

문제(객관식/주관식) 풀이 → 자동 채점·점수 적립 →

다음 전시 안내→

종료 요약(총점, 배지, 경품 교환) →

운영 데스크에서 경품 교환.

2. 운영자 대시보드

전시물/문항 CRUD(등록·수정·삭제), 난이도·태그·점수·소요시간 관리.

동선 템플릿(60/90/120분 × 연령·흥미) 등록/배포.

경품 정책(점수→등급→상품) 설정, 교환 처리 화면.

통계: 연령대/흥미/체류시간별 이용률, 전시별 문제 정답률·체류시간, 시간대 혼잡도.
