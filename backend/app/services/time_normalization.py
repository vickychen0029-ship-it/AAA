from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


@dataclass(slots=True)
class NormalizedBirthTime:
    iana_tz: str
    birth_local_dt: datetime
    birth_utc_dt: datetime
    dst_auto: bool
    dst_applied: bool


def normalize_birth_time(
    *,
    birth_local_dt: datetime,
    iana_tz: str,
    dst_auto: bool,
    dst_applied: bool | None,
) -> NormalizedBirthTime:
    """
    Normalize user birth datetime into both local (IANA tz) and UTC.

    The external timezone-resolution step is intentionally not done here.
    Caller must provide the resolved IANA timezone.
    """
    tz_key = (iana_tz or "").strip()
    if not tz_key:
        raise ValueError("iana_tz is required for normalization")

    try:
        zone = ZoneInfo(tz_key)
    except ZoneInfoNotFoundError as exc:
        raise ValueError(f"unsupported iana timezone: {tz_key}") from exc

    if birth_local_dt.tzinfo is None:
        local_dt = birth_local_dt.replace(tzinfo=zone)
    else:
        local_dt = birth_local_dt.astimezone(zone)

    detected_dst = _is_dst(local_dt)
    applied_dst = detected_dst if dst_auto else bool(dst_applied)

    utc_dt = local_dt.astimezone(timezone.utc)

    return NormalizedBirthTime(
        iana_tz=tz_key,
        birth_local_dt=local_dt,
        birth_utc_dt=utc_dt,
        dst_auto=dst_auto,
        dst_applied=applied_dst,
    )


def _is_dst(local_dt: datetime) -> bool:
    dst_delta = local_dt.dst()
    return bool(dst_delta and dst_delta.total_seconds() != 0)
