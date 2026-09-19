from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from activity_types import ACTIVITY_TYPES, PROFILE_TYPES

from services.activity_service import (
    compute_activity_score,
    suggest_better_window,
)

from services.demo_weather_provider import (
    DemoWeatherProvider,
    LocationNotSupportedError,
)

from services.demo_warning_provider import (
    DemoWarningProvider,
)

from services.decision_service import (
    get_candidate_warning_impact,
    make_final_decision,
    find_safe_better_window,
)


router = APIRouter(
    prefix="/activities",
    tags=["activities"]
)

weather_provider = DemoWeatherProvider()
warning_provider = DemoWarningProvider()


# ==================================================
# REQUEST MODEL
# ==================================================

class ActivityScoreRequest(BaseModel):
    activity_type: str
    location: str

    hour: int = Field(
        ...,
        ge=0,
        le=23,
        description="Hour of day, 0-23"
    )

    profile_key: Optional[str] = None


# ==================================================
# RESPONSE MODELS
# ==================================================

class FactorBreakdownItem(BaseModel):
    factor: str
    score: int
    weight_percent: int
    reason: str


class BetterWindow(BaseModel):
    suggested_hour: str
    suggested_score: int
    reason: str


class SafeWindowOption(BaseModel):
    direction: str
    suggested_hour: str
    suggested_score: int
    suggested_label: str
    warning_impact: str
    reason: str


class SafeBetterWindow(BaseModel):
    suggested_hour: str
    suggested_score: int
    suggested_label: str
    warning_impact: str
    reason: str

    earlier: Optional[SafeWindowOption] = None
    later: Optional[SafeWindowOption] = None


class FinalDecision(BaseModel):
    status: str
    level: str
    icon: str
    reason: str
    action: str
    warning_override: bool


class WarningInfo(BaseModel):
    impact: str
    title: Optional[str] = None
    severity: Optional[str] = None


class ActivityScoreResponse(BaseModel):
    activity_type: str
    activity_label: str
    icon: str
    hour: str

    # Normal personalized suitability
    score: int
    label: str

    factor_breakdown: List[FactorBreakdownItem]
    explanation: List[str]

    # Keep old field for frontend compatibility
    better_window: Optional[BetterWindow] = None

    # Warning-aware information
    warning: WarningInfo
    final_decision: FinalDecision

    # Warning-aware safer alternative
    safe_better_window: Optional[SafeBetterWindow] = None


# ==================================================
# ACTIVITY TYPES
# ==================================================

@router.get("/types")
def list_activity_types():

    return [
        {
            "key": key,
            "label": cfg["label"],
            "icon": cfg["icon"],
            "intensity": cfg["intensity"],
        }
        for key, cfg in ACTIVITY_TYPES.items()
    ]


# ==================================================
# SINGLE ACTIVITY SCORE
# ==================================================

@router.post(
    "/score",
    response_model=ActivityScoreResponse
)
def score_activity(
    payload: ActivityScoreRequest
):

    # --------------------------------------------------
    # ACTIVITY
    # --------------------------------------------------

    activity_config = ACTIVITY_TYPES.get(
        payload.activity_type
    )

    if activity_config is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Unknown activity type "
                f"'{payload.activity_type}'."
            ),
        )


    # --------------------------------------------------
    # PROFILE
    # --------------------------------------------------

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


    # --------------------------------------------------
    # WEATHER
    # --------------------------------------------------

    try:

        weather = (
            weather_provider
            .get_current_weather(
                payload.location
            )
        )

    except LocationNotSupportedError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc)
        )


    hour_data = weather.hourly_forecast[
        payload.hour
    ]


    # --------------------------------------------------
    # PERSONALIZED SUITABILITY SCORE
    # --------------------------------------------------

    (
        score,
        label,
        breakdown,
        explanation,
    ) = compute_activity_score(
        activity_config,
        hour_data,
        profile_config
    )


    # --------------------------------------------------
    # OLD BETTER WINDOW
    #
    # Keep this so the existing frontend does not break.
    # --------------------------------------------------

    better_window = suggest_better_window(
        activity_config,
        weather.hourly_forecast,
        payload.hour,
        score,
        profile_config=profile_config,
    )


    # ==================================================
    # WARNING INTELLIGENCE
    # ==================================================

    warnings = warning_provider.get_warnings(
        payload.location
    )


    (
        warning_impact,
        warning_data,
    ) = get_candidate_warning_impact(
        warnings=warnings,
        activity_type=payload.activity_type,
        activity_config=activity_config,
        candidate_hour=payload.hour,
    )


    # --------------------------------------------------
    # CONVERT WARNING INTO DECISION-SERVICE FORMAT
    # --------------------------------------------------

    warning_match = None

    if warning_data:

        warning_match = {
            "impact": warning_impact,

            "warning_title": warning_data.get(
                "title",
                "Weather warning"
            ),

            "action": warning_data.get(
                "action",
                "Take suitable weather precautions."
            ),
        }


    # ==================================================
    # FINAL WARNING-AWARE DECISION
    # ==================================================

    final_decision = make_final_decision(
        suitability_label=label,
        suitability_score=score,
        warning_match=warning_match,
    )


    # ==================================================
    # SAFE BETTER WINDOW
    #
    # Unlike suggest_better_window(), this also avoids
    # important warning periods.
    # ==================================================

    safe_better_window = (
        find_safe_better_window(
            activity_config=activity_config,

            hourly_forecast=
                weather.hourly_forecast,

            warnings=warnings,

            activity_type=
                payload.activity_type,

            current_hour=
                payload.hour,

            current_score=
                score,

            profile_config=
                profile_config,

            # Single Activity Check has no full-day
            # schedule to conflict with.
            occupied_hours=set(),

            reserved_hours=set(),
        )
    )


    # ==================================================
    # WARNING RESPONSE
    # ==================================================

    warning_info = {
        "impact": warning_impact,
        "title": (
            warning_data.get("title")
            if warning_data
            else None
        ),
        "severity": (
            warning_data.get("severity")
            if warning_data
            else None
        ),
    }


    # ==================================================
    # RESPONSE
    # ==================================================

    return ActivityScoreResponse(
        activity_type=
            payload.activity_type,

        activity_label=
            activity_config["label"],

        icon=
            activity_config["icon"],

        hour=
            hour_data.hour,

        score=
            score,

        label=
            label,

        factor_breakdown=
            breakdown,

        explanation=
            explanation,

        better_window=
            better_window,

        warning=
            warning_info,

        final_decision=
            final_decision,

        safe_better_window=
            safe_better_window,
    )