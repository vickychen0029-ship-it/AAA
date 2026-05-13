from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from app.services.deepseek_client import deepseek_client


SECTIONS = ["career", "love", "wealth", "health"]
QUESTIONS_PER_SECTION = 10
OPTION_KEYS = ["A", "B", "C", "D"]

SECTION_LABELS = {
    "career": "事业",
    "love": "爱情",
    "wealth": "财运",
    "health": "健康",
}

SYSTEM_LABELS = {
    "bazi": "八字",
    "zodiac": "星座",
    "ziwei": "紫微",
    "vedic": "印占",
}


@dataclass(slots=True)
class InterviewQuestionPlan:
    questions: dict[str, list[dict[str, Any]]]


def _fallback_questions(section: str) -> list[dict[str, Any]]:
    templates: dict[str, list[dict[str, Any]]] = {
        "career": [
            {"q": "当你推进关键项目时，更像哪种状态？", "o": ["先搭框架再冲刺落地", "边做边改，靠高压推进", "常被外部节奏打断", "先观察局势再下注"]},
            {"q": "面对比你更强势的同事/上级时，你通常会？", "o": ["先稳住目标，再谈边界", "当场硬碰硬，保住话语权", "表面配合，私下重构路径", "先退一步换更大空间"]},
            {"q": "你近一年的职业增长主要来自？", "o": ["系统化能力升级", "扛住高难任务后的信任", "跨团队资源整合", "频繁试错后的方向修正"]},
        ],
        "love": [
            {"q": "关系里出现分歧时，你第一反应更接近？", "o": ["先确认彼此真正诉求", "先表达感受再谈逻辑", "先冷处理等情绪下降", "先给方案避免失控"]},
            {"q": "你最在意伴侣提供哪种支持？", "o": ["稳定托底与长期一致", "高能共振与即时回应", "情绪包容与耐心倾听", "目标协同与现实执行"]},
            {"q": "当关系进入平淡期，你通常会？", "o": ["重建仪式感和节律", "主动制造新鲜刺激", "先观察是否价值错位", "用务实协作稳住关系"]},
        ],
        "wealth": [
            {"q": "面对高收益但高波动机会时，你更可能？", "o": ["先算风险边界再进场", "敢重仓，先拿窗口期", "小仓位试探后再放大", "先观望，宁可错过"]},
            {"q": "你的资金管理风格更接近？", "o": ["先保现金流，再谈增值", "收益优先，容忍波动", "动态配置，随势切换", "规则少，靠直觉决策"]},
            {"q": "若收入突然上升，你第一步通常会？", "o": ["建立更清晰的资产结构", "加码高回报项目", "先改善生活品质", "先留足缓冲再行动"]},
        ],
        "health": [
            {"q": "高压周期里，你最先被打乱的是？", "o": ["睡眠节律", "情绪稳定度", "饮食与运动习惯", "专注与恢复速度"]},
            {"q": "当身体发出疲劳信号时，你通常会？", "o": ["立刻降负荷并修复", "先扛完当前节点", "偶尔补救但难持续", "忽略信号继续推进"]},
            {"q": "你保持状态的核心方式更像？", "o": ["稳定作息+规律运动", "短期冲刺+集中休整", "靠兴趣活动释放压力", "依赖意志力硬撑"]},
        ],
    }

    seed = templates.get(section, templates["career"])
    items: list[dict[str, Any]] = []
    for idx in range(QUESTIONS_PER_SECTION):
        t = seed[idx % len(seed)]
        items.append(
            {
                "question": f"{SECTION_LABELS.get(section, section)}第{idx + 1}问：{t['q']}",
                "options": [{"key": key, "text": text} for key, text in zip(OPTION_KEYS, t["o"], strict=False)],
            }
        )
    return items


def _build_plan_prompt(system_type: str, system_payload: dict[str, Any], target_section: str | None) -> list[dict[str, str]]:
    sections = [target_section] if target_section in SECTIONS else SECTIONS
    system_label = SYSTEM_LABELS.get(system_type, "命盘")
    schema = {
        sections[0]: [
            {
                "question": "问题文本",
                "options": [
                    {"key": "A", "text": "选项A"},
                    {"key": "B", "text": "选项B"},
                    {"key": "C", "text": "选项C"},
                    {"key": "D", "text": "选项D"},
                ],
            }
        ]
    }
    return [
        {
            "role": "system",
            "content": (
                "你是命理互动问卷设计师。"
                f"根据{system_label}数据，为每个板块生成10道递进单选题。"
                "每题必须4个选项(A/B/C/D)，选项要互斥、具体、可代入。"
                "风格要求：70%现实人生场景，30%高概念隐喻；避免空泛鸡汤。"
                "问题应从事实层→模式层→决策层递进，选项要体现真实取舍冲突。"
                "可以少量使用系统/权限/升级等隐喻，但核心必须贴近现实经历。"
                "仅输出JSON对象，不要输出其他文本。"
                "health题避免医疗诊断词，侧重节律、压力和恢复习惯。"
            ),
        },
        {
            "role": "user",
            "content": (
                f"体系：{system_type} / {system_label}\\n"
                f"目标板块：{sections}\\n"
                f"命盘数据：{json.dumps(system_payload, ensure_ascii=False)}\\n"
                f"输出格式示例：{json.dumps(schema, ensure_ascii=False)}"
            ),
        },
    ]


def _normalize_question_item(item: Any) -> dict[str, Any] | None:
    if not isinstance(item, dict):
        return None
    question = str(item.get("question", "")).strip()
    raw_options = item.get("options")
    if not question or not isinstance(raw_options, list):
        return None
    options: list[dict[str, str]] = []
    used = set()
    for idx, raw in enumerate(raw_options):
        if not isinstance(raw, dict):
            continue
        key = str(raw.get("key", OPTION_KEYS[idx] if idx < len(OPTION_KEYS) else "")).strip().upper()
        text = str(raw.get("text", "")).strip()
        if key not in OPTION_KEYS or key in used or not text:
            continue
        used.add(key)
        options.append({"key": key, "text": text})
    if len(options) != 4:
        return None
    options = sorted(options, key=lambda x: OPTION_KEYS.index(x["key"]))
    return {"question": question, "options": options}


def build_question_plan(system_type: str, system_payload: dict[str, Any], target_section: str | None = None) -> InterviewQuestionPlan:
    sections = [target_section] if target_section in SECTIONS else SECTIONS
    if deepseek_client.enabled:
        try:
            result = deepseek_client.chat(
                messages=_build_plan_prompt(system_type, system_payload, target_section),
                temperature=0.7,
                max_tokens=6000,
                force_json=True,
            )
            parsed = json.loads(result.content)
            plan: dict[str, list[dict[str, Any]]] = {}
            for section in sections:
                raw_items = parsed.get(section) if isinstance(parsed, dict) else None
                normalized: list[dict[str, Any]] = []
                if isinstance(raw_items, list):
                    for raw in raw_items:
                        item = _normalize_question_item(raw)
                        if item:
                            normalized.append(item)
                fallback = _fallback_questions(section)
                while len(normalized) < QUESTIONS_PER_SECTION:
                    normalized.append(fallback[len(normalized)])
                plan[section] = normalized[:QUESTIONS_PER_SECTION]
            return InterviewQuestionPlan(questions=plan)
        except Exception:
            pass

    return InterviewQuestionPlan(questions={section: _fallback_questions(section) for section in sections})


def next_question(
    *,
    question_plan: dict[str, list[dict[str, Any]]],
    current_section_index: int,
    current_question_index: int,
) -> dict[str, Any] | None:
    section_order = [s for s in SECTIONS if s in question_plan]
    section_count = len(section_order)
    s_idx = current_section_index
    q_idx = current_question_index

    while s_idx < section_count:
        section_key = section_order[s_idx]
        questions = question_plan.get(section_key, [])
        if q_idx < len(questions):
            item = questions[q_idx]
            return {
                "section": section_key,
                "section_label": SECTION_LABELS[section_key],
                "section_index": s_idx,
                "question_index": q_idx,
                "question_number_in_section": q_idx + 1,
                "question_number_total": s_idx * QUESTIONS_PER_SECTION + q_idx + 1,
                "question": item["question"],
                "options": item["options"],
            }
        s_idx += 1
        q_idx = 0
    return None


def step_pointer(section_index: int, question_index: int, question_plan: dict[str, list[dict[str, Any]]]) -> tuple[int, int]:
    next_q = question_index + 1
    next_s = section_index
    current_section = [s for s in SECTIONS if s in question_plan][section_index]
    section_len = len(question_plan.get(current_section, []))
    if next_q >= section_len:
        next_q = 0
        next_s += 1
    section_count = len([s for s in SECTIONS if s in question_plan])
    if next_s > section_count:
        return section_count, 0
    return next_s, next_q


def _extract_core_marker(system_type: str, system_payload: dict[str, Any]) -> str:
    if system_type == "bazi":
        day_master = system_payload.get("dayMaster")
        if isinstance(day_master, dict):
            stem = str(day_master.get("stem", "") or "").strip()
            if stem:
                return f"{stem}日主"
    if system_type == "zodiac":
        sun_sign = str(system_payload.get("sun_sign", "") or "").strip()
        rising_sign = str(system_payload.get("rising_sign", "") or "").strip()
        if sun_sign or rising_sign:
            return " / ".join(x for x in [f"太阳{sun_sign}" if sun_sign else "", f"上升{rising_sign}" if rising_sign else ""] if x)
    if system_type == "ziwei":
        ming = str(system_payload.get("ming_palace", "") or "").strip()
        if ming:
            return f"命宫{ming}"
    if system_type == "vedic":
        asc = system_payload.get("ascendant")
        if isinstance(asc, dict):
            sign = str(asc.get("sign", "") or "").strip()
            if sign:
                return f"Lagna {sign}"
    return ""


def build_answer_feedback(
    *,
    system_type: str,
    system_payload: dict[str, Any],
    section: str,
    question: str,
    option_key: str,
    option_text: str,
) -> str:
    section_label = SECTION_LABELS.get(section, section)
    system_label = SYSTEM_LABELS.get(system_type, "命盘")
    core_marker = _extract_core_marker(system_type, system_payload)
    fallback_map = {
        "career": f"你选了{option_key}，这和你在事业里的“先定结构再推进”倾向一致。命盘更支持你掌控节奏而非被动追赶，这个选择与主轴高度同频。",
        "love": f"你选了{option_key}，说明你在关系里重“稳定回应与真实协同”。这与命盘里的情感安全需求一致，属于先稳内核再谈热度的路径。",
        "wealth": f"你选了{option_key}，体现出你对风险与收益边界的敏感度。命盘更支持“有框架地增长”，你的选择与这一财务节奏是契合的。",
        "health": f"你选了{option_key}，反映你已意识到状态管理比短期硬撑更关键。命盘对应的节律课题清晰，这个选择与“先修复再提速”一致。",
    }
    fallback = fallback_map.get(
        section,
        f"你的选择（{option_key}）与{section_label}板块的命盘特征较契合，说明你对自身节奏有清晰觉察。",
    )
    if core_marker:
        fallback = f"{fallback} 从{core_marker}看，这种取向更容易形成长期优势。"

    if not deepseek_client.enabled:
        return fallback
    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "你是命理互动反馈助手。用户每答一题，请给50-100字中文反馈。"
                    "语气以肯定、映射、鼓励为主，避免否定。"
                    "反馈要连接命盘结构和用户选择，不要泛泛而谈。"
                    "建议句式：先肯定选择→映射命盘特征→点出一条可持续方向。"
                    "允许少量高概念隐喻，但必须落到现实场景。"
                    "健康相关必须避免医疗诊断。"
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "system_type": system_type,
                        "system_label": system_label,
                        "section": section,
                        "payload": system_payload,
                        "question": question,
                        "selected": {"key": option_key, "text": option_text},
                    },
                    ensure_ascii=False,
                ),
            },
        ]
        result = deepseek_client.chat(messages=messages, temperature=0.6, max_tokens=220, force_json=False)
        text = result.content.strip().replace("\n", " ")
        if 40 <= len(text) <= 140:
            return text
    except Exception:
        pass
    return fallback


def build_final_summary(
    *,
    system_type: str,
    system_payload: dict[str, Any],
    answers: list[dict[str, Any]],
) -> dict[str, Any]:
    system_label = SYSTEM_LABELS.get(system_type, "命盘")
    fallback = {
        "career": {
            "score": 72,
            "analysis": "你的事业路径更适合“先稳住结构，再放大影响力”。保持阶段复盘，会比冲刺更有效。",
            "actions": ["把季度目标拆成双周节奏", "优先高杠杆任务", "每周一次策略复盘"],
        },
        "love": {
            "score": 70,
            "analysis": "你在关系里重视稳定与理解，越是明确边界与预期，越能建立长期安全感。",
            "actions": ["建立固定沟通窗口", "冲突时先复述再表达", "每月一次关系回顾"],
        },
        "wealth": {
            "score": 68,
            "analysis": "财务更适合稳健推进，先保证现金流秩序，再追求收益扩展。",
            "actions": ["建立月度现金流看板", "设置风险预算上限", "分层配置长期与短期资产"],
        },
        "health": {
            "score": 67,
            "analysis": "健康维度关键在节律稳定与恢复效率，先修复作息，再优化负荷。",
            "actions": ["固定睡眠时段", "每周至少3次轻中强度运动", "建立压力释放习惯"],
            "notice": "仅作参考，不替代医疗建议。",
        },
        "global_summary": f"你的答案与{system_label}结构整体同向，建议持续以“节奏管理+复盘优化”作为主线。",
        "generated_at": datetime.now(UTC).isoformat(),
    }
    if not deepseek_client.enabled:
        return fallback
    try:
        prompt = [
            {
                "role": "system",
                "content": (
                    f"你是{system_label}访谈分析师。根据命盘背景与问答记录输出JSON总结。"
                    "返回career/love/wealth/health/global_summary。"
                    "每板块含score(0-100),analysis(70-120字),actions(3条)。"
                    "health需含notice='仅作参考，不替代医疗建议。'"
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "system_type": system_type,
                        "payload": system_payload,
                        "answers": answers,
                    },
                    ensure_ascii=False,
                ),
            },
        ]
        result = deepseek_client.chat(messages=prompt, temperature=0.4, max_tokens=3000, force_json=True)
        parsed = json.loads(result.content)
        if isinstance(parsed, dict):
            parsed.setdefault("health", {})
            if isinstance(parsed["health"], dict):
                parsed["health"]["notice"] = "仅作参考，不替代医疗建议。"
            parsed["generated_at"] = datetime.now(UTC).isoformat()
            return parsed
    except Exception:
        pass
    return fallback
