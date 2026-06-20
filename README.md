# ExceptionIQ — Reconciliation Exception Orchestration Platform

ExceptionIQ is a purpose-built B2B SaaS platform designed to orchestrate the lifecycle of reconciliation exceptions from detection to closure. This monorepo implements the MVP for HDFC bank statement and general ledger reconciliation.

---

## 🛠️ Stack & Services

- **Frontend**: React + Vite + TypeScript (served on port `5173`)
- **Backend API**: Django 5.x + Django Rest Framework (served on port `8000`)
- **AI Service**: FastAPI + PyMuPDF + Groq SDK (served on port `8001`)
- **Database**: PostgreSQL 16 (mapped on port `5432`)
- **Containers**: Docker Compose

---

## 📂 Port Map & Endpoints

| Service | Port | Endpoint / URL |
|---|---|---|
| **Vite Frontend** | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Django API Gateway** | `8000` | [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/) |
| **FastAPI AI Service** | `8001` | [http://localhost:8001](http://localhost:8001) |
| **PostgreSQL DB** | `5432` | `localhost:5432` |

---

## 🚀 Setup & Execution

### 1. Configure Environment Variables
Copy the template configuration file to `.env` in the root folder:
```bash
cp .env.example .env
```
Edit the `.env` file to customize settings:
- `GROQ_API_KEY`: *(Optional)* If set, the FastAPI service will query Groq LLM (Llama 3.1 8B) for natural language insights. If left empty, the application falls back to a smart, rule-based local summary generator automatically.
- `VITE_DEV_TOOLS`: Set to `true` to enable Developer Tools (Navbar Role Switcher and Reset DB buttons). Set to `false` to test the clean client-ready B2B production view.

### 2. Local Virtual Environment (Host)
For host-based code execution and editor autocompletion:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # On Windows
# or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
```

### 3. Launch Services with Docker Compose
From the root directory, build and run the services in the background:
```bash
docker compose up --build -d
```
Docker Compose automatically:
1. Performs migrations on the Postgres database.
2. Seeds default entities, users, routing rules, and **30 detailed exceptions** across all statuses.
3. Starts the dev server instances for frontend, backend, and FastAPI.

---

## 📋 Seeding & Testing Workflows

### Idempotent Database Seeding
On startup, `docker-compose` runs the custom `seed_db` command automatically. You can also trigger it manually at any time to re-populate the tables:
- **Via Docker**:
  ```bash
  docker compose exec backend python manage.py seed_db
  ```
- **Via Local host environment** (requires local `.venv` active):
  ```bash
  python backend/manage.py seed_db
  ```

### Maker-Checker & Role Switching
1. Open the UI at [http://localhost:5173](http://localhost:5173).
2. With `VITE_DEV_TOOLS=true` set, use the **Role Switcher** dropdown in the top navbar to swap between roles:
   - **Analyst**: Go to the **Exceptions Queue**, select a `BANK-AMT` exception. Ask AI for insights, post comment, choose a resolution code, and click **Submit Resolution**. The status transitions to `resolved`.
   - **Approver**: Swap to the Approver role, open the resolved exception, and review the **Maker-Checker** panel. Click **Approve & Close** or **Reject**.
3. Confirm that stats card counts in the **Dashboard** update dynamically.

### Clear Database (Reset Data)
To wipe all transactions, batches, and exception records cleanly for testing:
- Click the **⚠️ Reset DB** button in the navbar (only visible in dev mode).
- Backend enforces this action via a `settings.DEBUG` check, preventing random wipes in non-debug environments.
