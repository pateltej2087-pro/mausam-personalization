from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from activity_types import (
    ACTIVITY_TYPES,
    PROFILE_TYPES,
)

from services.demo_weather_provider import (
    DemoWeatherProvider,
    LocationNotSupportedError,
)

from services.demo_warning_provider import (
    DemoWarningProvider,
)

from services.planner_service import (
    build_day_plan,
)

from services.warning_impact_service import (
    analyse_warning_impacts,
)

from services.decision_service import (
    build_final_recommendations,
    build_overall_day_summary,
)


router = APIRouter(
    prefix="/personalized",
    tags=["personalized"],
)


weather_provider = DemoWeatherProvider()
warning_provider = DemoWarningProvider()


# =========================================================
# REQUEST MODELS
# =========================================================

class PersonalizedActivity(BaseModel):
    activity_type: str

    hour: int = Field(
        ...,
        ge=0,
        le=23,
        description="Planned hour from 0 to 23",
    )


class PersonalizedDayRequest(BaseModel):
    location: str

    # Optional so older frontend requests still work.
    profile_key: str | None = None

    activities: List[PersonalizedActivity]


# =========================================================
# PERSONALIZED DAY ENDPOINT
# =========================================================

@router.post("/day")
def build_personalized_day(
    payload: PersonalizedDayRequest,
):

    # -----------------------------------------------------
    # 1. PROFILE VALIDATION
    # -----------------------------------------------------

    profile_config = None

    if payload.profile_key:

        profile_config = PROFILE_TYPES.get(
            payload.profile_key
        )

        if profile_config is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Unknown profile "
                    f"'{payload.profile_key}'."
                ),
            )

    # -----------------------------------------------------
    # 2. ACTIVITY VALIDATION
    # -----------------------------------------------------

    if not payload.activities:
        raise HTTPException(
            status_code=400,
            detail="Add at least one activity.",
        )

    for activity in payload.activities:

        if activity.activity_type not in ACTIVITY_TYPES:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Unknown activity type "
                    f"'{activity.activity_type}'."
                ),
            )

    # -----------------------------------------------------
    # 3. WEATHER
    # -----------------------------------------------------

    try:
        weather = weather_provider.get_current_weather(
            payload.location
        )

    except LocationNotSupportedError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    # -----------------------------------------------------
    # 4. PREPARE ACTIVITIES
    # -----------------------------------------------------

    planned_activities = [
        {
            "activity_type": activity.activity_type,
            "hour": activity.hour,
        }
        for activity in payload.activities
    ]

    # -----------------------------------------------------
    # 5. ACTIVITY SUITABILITY / DAY PLANNER
    # -----------------------------------------------------

    planner_result = build_day_plan(
        planned_activities=planned_activities,
        hourly_forecast=weather.hourly_forecast,
        activity_types=ACTIVITY_TYPES,
        profile_config=profile_config,
    )

    # -----------------------------------------------------
    # 6. WEATHER WARNINGS
    # -----------------------------------------------------

    warnings = warning_provider.get_warnings(
        payload.location
    )

    # -----------------------------------------------------
    # 7. PERSONALIZED WARNING IMPACT
    # -----------------------------------------------------

    warning_result = analyse_warning_impacts(
        warnings=warnings,
        planned_activities=planned_activities,
        activity_types=ACTIVITY_TYPES,
    )

    # -----------------------------------------------------
    # 8. FINAL DECISION ENGINE
    # -----------------------------------------------------

    recommendations = build_final_recommendations(
        planner_result=planner_result,
        warning_result=warning_result,
        hourly_forecast=weather.hourly_forecast,
        activity_types=ACTIVITY_TYPES,
        warnings=warnings,
        profile_config=profile_config,
    )

    # -----------------------------------------------------
    # 9. FINAL DECISION COUNTS
    # -----------------------------------------------------

    green_count = 0
    yellow_count = 0
    orange_count = 0
    red_count = 0

    for recommendation in recommendations:

        level = recommendation.get(
            "final_level"
        )

        if level == "GREEN":
            green_count += 1

        elif level == "YELLOW":
            yellow_count += 1

        elif level == "ORANGE":
            orange_count += 1

        elif level == "RED":
            red_count += 1

    # -----------------------------------------------------
    # 10. SMART OVERALL DAY SUMMARY
    # -----------------------------------------------------

    overall = build_overall_day_summary(
        recommendations
    )

    # -----------------------------------------------------
    # FINAL RESPONSE
    # -----------------------------------------------------

    return {
        "location": weather.location,

        "source": weather.source,

        "warning_source":
            warning_provider.source_name,

        "is_demo_data": True,

        # ---------------------------------------------
        # APPLIED PROFILE
        # ---------------------------------------------

        "profile": (
            {
                "key": payload.profile_key,
                "label": profile_config["label"],
                "icon": profile_config["icon"],
            }
            if profile_config
            else None
        ),

        # ---------------------------------------------
        # SMART OVERALL DECISION
        # ---------------------------------------------

        "overall_status":
            overall["overall_status"],

        "overall_level":
            overall["overall_level"],

        "overall_icon":
            overall["overall_icon"],

        "overall_summary":
            overall["overall_summary"],

        # ---------------------------------------------
        # DECISION COUNTS
        # ---------------------------------------------

        "decision_counts": {
            "green": green_count,
            "yellow": yellow_count,
            "orange": orange_count,
            "red": red_count,
        },

        # ---------------------------------------------
        # DETAILED RESULTS
        # ---------------------------------------------

        "planner":
            planner_result,

        "warning_analysis":
            warning_result,

        "recommendations":
            recommendations,
    }