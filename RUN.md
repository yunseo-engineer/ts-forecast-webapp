# 기동 가이드 (RUN.md)

본 프로젝트는 다음 3개 서비스로 구성되어 있습니다.

| 서비스 | 디렉터리 | 포트 | 설명 |
|---|---|---|---|
| Backend (FastAPI) | `backend/` | **8000** | 예측 API 서버 |
| Frontend (기본) | `frontend/` | **3000** | 베이스라인 UI (Next.js) |
| Frontend (디자인 리뉴얼) | `frontend-design/` | **3001** | 디자인 리뉴얼 버전 (Next.js) |

> 두 프론트엔드 모두 동일한 백엔드(8000)를 호출하므로, **백엔드를 먼저 기동**하고 원하는 프론트엔드를 띄우면 됩니다. 두 프론트엔드를 동시에 띄워도 포트가 다르므로 충돌하지 않습니다.

---

## 1. 시스템 종료 (Shutdown)

각 터미널에서 `Ctrl+C` (macOS도 `Ctrl+C`, `Cmd+C` 아님) 로 정상 종료하는 것이 가장 깔끔합니다. 터미널을 닫아버려서 좀비 프로세스가 남았을 때만 아래 절차를 사용하세요.

### Windows (PowerShell)

```powershell
# 8000(backend), 3000(frontend), 3001(frontend-design) 포트를 사용 중인 프로세스 확인
Get-NetTCPConnection -LocalPort 3000,3001,8000 -ErrorAction SilentlyContinue |
  Select-Object LocalPort, State, OwningProcess

# 위에서 확인된 PID 모두 종료
Stop-Process -Id <PID1>,<PID2>,<PID3> -Force
```

#### 자식(워커) 프로세스 주의 (Windows)

`uvicorn --reload` 는 부모 프로세스 외에 멀티프로세싱 자식 프로세스를 만듭니다. 부모만 종료하면 자식이 8000 포트를 그대로 잡고 있을 수 있으므로, 종료 후 포트가 여전히 LISTEN 상태라면 다음으로 자식을 찾아 종료하세요.

```powershell
# 남아있는 python.exe 자식 프로세스 확인 (multiprocessing-fork 인자 포함)
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
  Select-Object ProcessId, ParentProcessId, CommandLine

# 해당 PID 종료
Stop-Process -Id <자식PID> -Force
```

#### 한 줄 강제 종료 (Windows)

```powershell
# 모든 node/python 프로세스를 종료 — 다른 작업 중인 node/python 도 함께 죽으니 주의
Get-Process node,python -ErrorAction SilentlyContinue | Stop-Process -Force
```

### macOS / Linux

```bash
# 8000(backend), 3000(frontend), 3001(frontend-design) 포트를 사용 중인 프로세스 확인
lsof -i :3000 -i :3001 -i :8000 -sTCP:LISTEN

# 포트별로 한 번에 종료 (해당 포트를 LISTEN 중인 PID 자동 추출)
kill -9 $(lsof -ti :3000)
kill -9 $(lsof -ti :3001)
kill -9 $(lsof -ti :8000)
```

#### 자식(워커) 프로세스 주의 (macOS / Linux)

`uvicorn --reload` 의 reloader 가 부모–자식 프로세스 구조로 동작합니다. 부모만 종료하면 자식이 8000 포트를 잡고 있을 수 있으니, 종료 후에도 포트가 살아 있으면 자식 프로세스를 직접 정리하세요.

```bash
# uvicorn 관련 프로세스 전부 보기
ps -ef | grep -E 'uvicorn|main:app' | grep -v grep

# 한 번에 정리
pkill -9 -f 'uvicorn main:app'
```

#### 한 줄 강제 종료 (macOS / Linux)

```bash
# 다른 node/python 작업이 없을 때만 사용
pkill -9 -f 'next dev'
pkill -9 -f 'uvicorn'
```

---

## 2. 시스템 기동 (Startup)

### 사전 준비 (최초 1회)

#### 백엔드 가상환경 + 의존성 설치
```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
# source .venv/bin/activate
pip install -r requirements.txt
```

#### 프론트엔드 의존성 설치 (둘 다)
```bash
cd frontend
npm install

cd ../frontend-design
npm install
```

---

### 기동 순서

> **반드시 백엔드를 먼저 띄운 뒤** 프론트엔드를 띄우세요. 프론트엔드의 `/api/*` 요청은 `http://localhost:8000` 으로 프록시됩니다.

#### ① 백엔드 (터미널 1)

```bash
cd backend
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

기동 확인:
- 브라우저에서 http://localhost:8000/api/health 접속 → `{"ok": true}` 응답이면 정상

#### ② 프론트엔드 — 기본 (터미널 2)

```bash
cd frontend
npm run dev
```

→ http://localhost:3000

#### ③ 프론트엔드 — 디자인 리뉴얼 (터미널 3)

```bash
cd frontend-design
npm run dev
```

→ http://localhost:3001

> `frontend-design/package.json` 의 `dev` 스크립트가 `next dev -p 3001` 로 정의되어 있어 자동으로 3001 포트를 사용합니다.

---

## 3. 백엔드 호스트 변경 (선택)

프론트엔드에서 다른 호스트의 백엔드를 사용하려면 각 프론트엔드 디렉터리에 `.env.local` 파일을 만드세요.

```bash
# frontend/.env.local  또는  frontend-design/.env.local
NEXT_PUBLIC_BACKEND_URL=https://your-backend.example.com
```

설정 후 `npm run dev` 를 재시작해야 반영됩니다.

---

## 4. 자주 발생하는 문제

| 증상 | 원인 / 해결 |
|---|---|
| `EADDRINUSE: address already in use :::3000` | 이전 `npm run dev` 프로세스가 살아있음 → "1. 시스템 종료" 절차로 정리 |
| 브라우저에서 `/api/forecast` 가 502/연결 거부 | 백엔드(8000)가 안 떠 있거나 죽음 → `http://localhost:8000/api/health` 로 먼저 확인 |
| 종료 후에도 8000 포트가 LISTEN 상태 | uvicorn `--reload` 자식 프로세스가 살아있음 → "자식(워커) 프로세스 주의" 항목 참고 |
| `ModuleNotFoundError` (백엔드) | 가상환경 미활성화 → `.venv\Scripts\activate` 후 `pip install -r requirements.txt` |
| 프론트 빌드 시 타입 오류 | `node_modules` 가 없거나 손상 → 해당 디렉터리에서 `npm install` 재실행 |

---

## 5. 포트 요약

```
┌─────────────────────────┐         ┌──────────────────────┐
│ frontend  (3000)        │ ──┐     │                      │
├─────────────────────────┤   ├──►  │  backend  (8000)     │
│ frontend-design (3001)  │ ──┘     │  FastAPI / uvicorn   │
└─────────────────────────┘         └──────────────────────┘
       Next.js dev 서버                 /api/* 프록시 대상
```
