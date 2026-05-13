from __future__ import annotations

import os
import sys


ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app as backend_app  # noqa: E402


PREFIX = "/_/backend"


async def app(scope, receive, send):  # type: ignore[override]
    if scope.get("type") in {"http", "websocket"}:
        path = scope.get("path", "") or ""
        if path.startswith(PREFIX):
            new_scope = dict(scope)
            new_scope["root_path"] = PREFIX
            stripped = path[len(PREFIX) :]
            new_scope["path"] = stripped if stripped else "/"
            scope = new_scope
    await backend_app(scope, receive, send)
