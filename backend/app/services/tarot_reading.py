from __future__ import annotations

import json
from typing import Any

from app.services.deepseek_client import deepseek_client


def _trim_text(value: str, min_len: int = 70, max_len: int = 150) -> str:
    text = " ".join(str(value or "").strip().split())
    if not text:
        return ""
    if len(text) > max_len:
        text = text[:max_len].rstrip("，。；、,.!！?？ ")
    if len(text) < min_len:
        return text
    return text


def _fallback_card_text(position: str, name: str, orientation: str, base_meaning: str, question: str) -> str:
    focus = "你的这个问题"
    if question.strip():
        focus = f"围绕“{question.strip()}”这个问题"
    orientation_hint = "当前能量更顺畅，适合主动推进。" if orientation == "正位" else "当前有卡点，先修正节奏再推进更稳。"
    text = (
        f"{position}位出现{name}{orientation}，{focus}，它提示你{base_meaning}"
        f"{orientation_hint}建议你把注意力放在可执行的小步骤上，先稳住关键变量，再做下一轮选择。"
    )
    return _trim_text(text, min_len=60, max_len=130) or text


def _fallback_overall(question: str, cards: list[dict[str, str]]) -> str:
    names = "、".join(f"{c['position']}位{c['name']}{c['orientation']}" for c in cards)
    if question.strip():
        text = f"关于“{question.strip()}”，本次牌阵呈现为：{names}。整体建议是先复盘过往模式，再聚焦当下决策点，最后以低风险试探推进未来路径。"
    else:
        text = f"本次牌阵呈现为：{names}。整体建议是先复盘过往模式，再聚焦当下决策点，最后以低风险试探推进未来路径。"
    return _trim_text(text, min_len=70, max_len=150) or text


def build_tarot_reading(question: str, cards: list[dict[str, str]]) -> dict[str, Any]:
    normalized_cards: list[dict[str, str]] = []
    for card in cards:
        normalized_cards.append(
            {
                "position": str(card.get("position", "")).strip() or "位置",
                "name": str(card.get("name", "")).strip() or "未知牌",
                "orientation": str(card.get("orientation", "")).strip() or "正位",
                "base_meaning": str(card.get("base_meaning", "")).strip() or "请结合现实场景做谨慎判断。",
            }
        )

    fallback_cards = [
        {
            "position": c["position"],
            "name": c["name"],
            "orientation": c["orientation"],
            "analysis": _fallback_card_text(c["position"], c["name"], c["orientation"], c["base_meaning"], question),
        }
        for c in normalized_cards
    ]
    fallback = {
        "provider": "local",
        "overall": _fallback_overall(question, normalized_cards),
        "cards": fallback_cards,
    }

    if not deepseek_client.enabled:
        return fallback

    prompt = [
        {
            "role": "system",
            "content": (
                "你是专业塔罗解读师。请根据用户问题和三张牌，输出严格JSON。"
                "要求：每张牌给80-120字中文分析，必须结合位置(过去/现在/未来)+牌名+正逆位。"
                "语气专业、具体、可执行，不要玄而又玄，不要鸡汤。"
                "同时输出overall字段，90-140字，总结三张牌联动逻辑和建议。"
                "JSON格式："
                "{\"overall\":\"...\",\"cards\":[{\"position\":\"过去\",\"name\":\"...\",\"orientation\":\"正位\",\"analysis\":\"...\"}]}"
            ),
        },
        {
            "role": "user",
            "content": json.dumps({"question": question, "cards": normalized_cards}, ensure_ascii=False),
        },
    ]

    try:
        result = deepseek_client.chat(
            messages=prompt,
            temperature=0.6,
            max_tokens=1400,
            force_json=True,
            timeout_seconds=12,
        )
        parsed = json.loads(result.content)
        overall = _trim_text(str(parsed.get("overall", "")).strip(), min_len=60, max_len=180)
        raw_cards = parsed.get("cards")
        if not isinstance(raw_cards, list):
            return fallback
        mapped: list[dict[str, str]] = []
        for idx, item in enumerate(raw_cards[:3]):
            if not isinstance(item, dict):
                continue
            card = normalized_cards[idx]
            text = _trim_text(str(item.get("analysis", "")).strip(), min_len=60, max_len=150)
            mapped.append(
                {
                    "position": card["position"],
                    "name": card["name"],
                    "orientation": card["orientation"],
                    "analysis": text or fallback_cards[idx]["analysis"],
                }
            )
        if len(mapped) != 3:
            return fallback
        return {
            "provider": "deepseek",
            "overall": overall or fallback["overall"],
            "cards": mapped,
        }
    except Exception:
        return fallback
