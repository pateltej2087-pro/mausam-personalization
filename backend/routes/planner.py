from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from activity_types import ACTIVITY_TYPES
from services.demo_weather_provider import (
    DemoWeatherProvider,
    LocationNotSupportedError,
)
from services.planner_service import build_day_plan


router = APIRouter(
    prefix="/planner",
    tags=["planner"],
)

weather_provider = DemoWeatherProvider()


# ==========================================
# REQUEST MODELS
# ==========================================

class PlannedActivity(BaseModel):
    activity_type: str

    hour: int = Field(
        ...,
        ge=0,
        le=23,
        description="Planned hour from 0 to 23",
    )


class DayPlanRequest(BaseModel):
    location: str

    activities: List[PlannedActivity]


# ==========================================
# PLANNER ENDPOINT
# ==========================================

@router.post("/evaluate")
def evaluate_day_plan(payload: DayPlanRequest):
    """
    Evaluate multiple activities against the day's
    hourly weather forecast.

    Example:

    {
        "location": "Ahmedabad",
        "activities": [
            {
                "activity_type": "college_commute",
                "hour": 8
            },
            {
                "activity_type": "cricket",
                "hour": 17
            },
            {
                "activity_type": "walking",
                "hour": 20
            }
        ]
    }
    """

    # ==========================================
    # VALIDATE ACTIVITIES
    # ==========================================

    for activity in payload.activities:

        if activity.activity_type not in ACTIVITY_TYPES:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Unknown activity type "
                    f"'{activity.activity_type}'."
                ),
            )

    # ==========================================
    # GET WEATHER
    # ==========================================

    try:
        weather = weather_provider.get_current_weather(
            payload.location
        )

    except LocationNotSupportedError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    # Convert Pydantic objects into simple dictionaries
    planned_activities = [
        {
            "activity_type": activity.activity_type,
            "hour": activity.hour,
        }
        for activity in payload.activities
    ]

    # ==========================================
    # BUILD PERSONALIZED DAY PLAN
    # ==========================================

    result = build_day_plan(
        planned_activities=planned_activities,
        hourly_forecast=weather.hourly_forecast,
        activity_types=ACTIVITY_TYPES,
    )

    # Add useful metadata
    result["location"] = weather.location
    result["source"] = weather.source
    result["is_demo_data"] = weather.is_demo_data

    return result