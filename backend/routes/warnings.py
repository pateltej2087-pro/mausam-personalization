from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from activity_types import ACTIVITY_TYPES
from services.demo_warning_provider import DemoWarningProvider
from services.demo_weather_provider import CITY_PROFILES
from services.warning_impact_service import analyse_warning_impacts


router = APIRouter(
    prefix="/warnings",
    tags=["warnings"],
)

warning_provider = DemoWarningProvider()


# ==========================================
# REQUEST MODELS
# ==========================================

class WarningPlannedActivity(BaseModel):
    activity_type: str

    hour: int = Field(
        ...,
        ge=0,
        le=23,
        description="Planned hour from 0 to 23",
    )


class WarningImpactRequest(BaseModel):
    location: str

    activities: List[WarningPlannedActivity]


# ==========================================
# HELPER
# ==========================================

def validate_location(location: str):
    key = location.strip().lower()

    if key not in CITY_PROFILES:
        supported = ", ".join(
            profile["display_name"]
            for profile in CITY_PROFILES.values()
        )

        raise HTTPException(
            status_code=404,
            detail=(
                f"'{location}' is not a supported demo location. "
                f"Supported: {supported}"
            ),
        )

    return key


# ==========================================
# GET WARNINGS FOR LOCATION
# ==========================================

@router.get("/{location}")
def get_location_warnings(location: str):
    """
    Return simulated warnings for one location.

    IMPORTANT:
    These warnings are DEMO/SIMULATED and are not
    official live IMD warnings.
    """

    validate_location(location)

    warnings = warning_provider.get_warnings(
        location
    )

    return {
        "location": location,
        "warning_count": len(warnings),
        "warnings": warnings,
        "source": warning_provider.source_name,
        "is_demo_data": True,
    }


# ==========================================
# PERSONALIZED WARNING IMPACT
# ==========================================

@router.post("/impact/evaluate")
def evaluate_warning_impact(
    payload: WarningImpactRequest
):
    """
    Match warnings against the user's planned day.

    Example:

    {
        "location": "Ahmedabad",
        "activities": [
            {
                "activity_type": "college_commute",
                "hour": 8
            },
            {
                "activity_type": "outdoor_event",
                "hour": 13
            },
            {
                "activity_type": "cricket",
                "hour": 17
            }
        ]
    }
    """

    validate_location(payload.location)


    # ==========================================
    # VALIDATE ACTIVITY TYPES
    # ==========================================

    for activity in payload.activities:

        if (
            activity.activity_type
            not in ACTIVITY_TYPES
        ):
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Unknown activity type "
                    f"'{activity.activity_type}'."
                ),
            )


    # ==========================================
    # GET WARNINGS
    # ==========================================

    warnings = warning_provider.get_warnings(
        payload.location
    )


    # ==========================================
    # CONVERT REQUEST TO SIMPLE DICTIONARIES
    # ==========================================

    planned_activities = [
        {
            "activity_type":
                activity.activity_type,

            "hour":
                activity.hour,
        }
        for activity in payload.activities
    ]


    # ==========================================
    # PERSONALIZED WARNING ANALYSIS
    # ==========================================

    result = analyse_warning_impacts(
        warnings=warnings,
        planned_activities=planned_activities,
        activity_types=ACTIVITY_TYPES,
    )


    # ==========================================
    # METADATA
    # ==========================================

    result["location"] = payload.location
    result["source"] = warning_provider.source_name
    result["is_demo_data"] = True

    return result