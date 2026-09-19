from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from activity_types import ACTIVITY_TYPES
from database import get_db
from services.activity_service import compute_activity_score
from services.change_service import compare_weather
from services.history_service import (
    get_latest_weather_check,
    get_previous_weather_check,
)

router = APIRouter(prefix="/changes", tags=["changes"])


class WeatherSnapshot:
    """
    Small adapter that gives database records the same attributes
    expected by compare_weather() and compute_activity_score().
    """

    def __init__(self, record):
        self.temperature_c = record.temperature_c
        self.humidity_percent = record.humidity_percent
        self.rain_probability_percent = record.rain_probability_percent
        self.wind_speed_kmph = record.wind_speed_kmph
        self.visibility_km = record.visibility_km
        self.aqi = record.aqi
        self.condition = record.condition


@router.get("")
def get_weather_changes(
    location: str = Query(
        ...,
        description="City name, e.g. Ahmedabad",
    ),
    activity_type: str | None = Query(
        None,
        description="Optional activity such as cricket or running",
    ),
    db: Session = Depends(get_db),
):
    """
    Compare the latest stored weather check with the user's
    actual previous check for the same location.
    """

    # Normalize location because database stores display names.
    location = location.strip()

    previous_record = get_previous_weather_check(
        db,
        location,
    )

    latest_record = get_latest_weather_check(
        db,
        location,
    )

    # We need at least two visits for a comparison.
    if previous_record is None or latest_record is None:
        return {
            "location": location,
            "has_previous_check": False,
            "message": (
                "No previous weather check is available yet. "
                "Check this location again later to see what changed."
            ),
            "changes": [],
            "activity_impact": None,
        }

    previous = WeatherSnapshot(previous_record)
    current = WeatherSnapshot(latest_record)

    changes = compare_weather(
        previous,
        current,
    )

    activity_impact = None

    # ==========================================
    # OPTIONAL ACTIVITY IMPACT
    # ==========================================

    if activity_type:
        activity_config = ACTIVITY_TYPES.get(activity_type)

        if activity_config is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Unknown activity type "
                    f"'{activity_type}'."
                ),
            )

        previous_score, previous_label, _, _ = (
            compute_activity_score(
                activity_config,
                previous,
            )
        )

        current_score, current_label, _, _ = (
            compute_activity_score(
                activity_config,
                current,
            )
        )

        score_change = current_score - previous_score

        if score_change >= 10:
            impact = "IMPROVED"

            message = (
                f"Conditions for "
                f"{activity_config['label']} improved "
                f"from {previous_score}/100 "
                f"to {current_score}/100."
            )

        elif score_change <= -10:
            impact = "WORSENED"

            message = (
                f"Conditions for "
                f"{activity_config['label']} worsened "
                f"from {previous_score}/100 "
                f"to {current_score}/100."
            )

        else:
            impact = "LITTLE_CHANGE"

            message = (
                f"Conditions for "
                f"{activity_config['label']} have not "
                f"changed significantly "
                f"({previous_score}/100 → "
                f"{current_score}/100)."
            )

        activity_impact = {
            "activity_type": activity_type,
            "activity_label": activity_config["label"],
            "icon": activity_config["icon"],
            "previous_score": previous_score,
            "previous_label": previous_label,
            "current_score": current_score,
            "current_label": current_label,
            "score_change": score_change,
            "impact": impact,
            "message": message,
        }

    return {
        "location": latest_record.location,

        "has_previous_check": True,

        "previous_check_time": (
            previous_record.requested_at.isoformat()
        ),

        "current_check_time": (
            latest_record.requested_at.isoformat()
        ),

        "change_count": len(changes),

        "has_meaningful_changes": len(changes) > 0,

        "changes": changes,

        "activity_impact": activity_impact,

        "source": latest_record.source,

        "is_demo_data": latest_record.source == "DEMO",
    }