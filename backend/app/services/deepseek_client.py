from __future__ import annotations

import json
import socket
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import settings


@dataclass(slots=True)
class DeepSeekResult:
    content: str
    raw: dict[str, Any]


class DeepSeekClient:
    def __init__(self) -> None:
        self._api_key = settings.DEEPSEEK_API_KEY
        self._base_url = settings.DEEPSEEK_BASE_URL.rstrip("/")
        self._model = settings.DEEPSEEK_MODEL
        self._timeout = settings.DEEPSEEK_TIMEOUT_SECONDS

    @property
    def enabled(self) -> bool:
        return bool(self._api_key)

    def chat(
        self,
        *,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        force_json: bool = False,
        timeout_seconds: int | None = None,
    ) -> DeepSeekResult:
        if not self._api_key:
            raise RuntimeError("DEEPSEEK_API_KEY is not configured")

        payload: dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if force_json:
            payload["response_format"] = {"type": "json_object"}

        request = Request(
            url=f"{self._base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self._api_key}",
            },
            method="POST",
        )
        timeout = int(timeout_seconds or self._timeout)
        timeout = max(3, min(timeout, 20))

        try:
            with urlopen(request, timeout=timeout) as response:
                raw = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"DeepSeek HTTP error: {exc.code} {detail}") from exc
        except (TimeoutError, socket.timeout) as exc:
            raise RuntimeError("DeepSeek request timeout") from exc
        except URLError as exc:
            raise RuntimeError(f"DeepSeek network error: {exc.reason}") from exc

        choices = raw.get("choices") or []
        if not choices:
            raise RuntimeError("DeepSeek response missing choices")
        message = choices[0].get("message") or {}
        content = message.get("content")
        if not isinstance(content, str) or not content.strip():
            raise RuntimeError("DeepSeek response content is empty")
        return DeepSeekResult(content=content, raw=raw)


deepseek_client = DeepSeekClient()
