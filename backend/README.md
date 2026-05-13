# SMWeb Backend

FastAPI + SQLAlchemy backend skeleton with Alembic migrations.

## Requirements

- Python 3.11+

## Quick Start

1. Install dependencies:

```bash
pip install -e .
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Run initial migration:

```bash
alembic upgrade head
```

4. Start API server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Implemented V1 Endpoints

- `POST /profiles`
- `GET /profiles`
- `GET /profiles/{id}`
- `PUT /profiles/{id}`
- `DELETE /profiles/{id}`
- `POST /charts/natal`
- `GET /charts/natal/{id}`
- `POST /reports/natal`
- `POST /ai-interview/bazi/start`
- `GET /ai-interview/bazi/latest/{profile_id}`
- `POST /ai-interview/bazi/{session_id}/answer`
- `GET /ai-interview/bazi/{session_id}/export`
- `DELETE /ai-interview/bazi/{session_id}`

## Notes

- Swiss Ephemeris integration uses `pyswisseph` when available.
- If `pyswisseph` is unavailable, the API falls back to deterministic mock chart payloads for local development.
- AI interview supports DeepSeek integration when `DEEPSEEK_API_KEY` is configured; otherwise it falls back to deterministic local question/summary logic for development.

## Project Structure

- `app/main.py`: FastAPI application entry.
- `app/core/`: configuration, logging, security, error handlers.
- `app/db/`: SQLAlchemy base + session/engine setup.
- `app/models/`: ORM models.
- `app/schemas/`: Pydantic request/response schemas.
- `alembic/`: migration environment and revisions.
