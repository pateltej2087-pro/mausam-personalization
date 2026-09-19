"""
Personalized Final Decision Engine

Combines:
1. Activity weather suitability
2. Weather-warning impact
3. Multiple active warnings
4. Final warning-aware decision
5. Safe better-window recommendation
6. Schedule-conflict protection
7. User-friendly combined explanation
"""

from services.activity_service import compute_activity_score


# =========================================================
# WARNING IMPACT PRIORITY
# =========================================================

IMPACT_RANK = {
    "NONE": 0,
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
}


# =========================================================
# FORMAT TIME
# =========================================================

def format_time(hour_value):
    """
    Convert 24-hour time to AM/PM for display.

    8       -> 08:00 AM
    13      -> 01:00 PM
    "17:00" -> 05:00 PM
    "20:00" -> 08:00 PM
    """

    if hour_value is None:
        return ""

    try:
        if isinstance(hour_value, str):
            hour = int(
                hour_value.split(":")[0]
            )
        else:
            hour = int(hour_value)

    except (ValueError, TypeError):
        return str(hour_value)

    hour = hour % 24

    period = (
        "AM"
        if hour < 12
        else "PM"
    )

    display_hour = hour % 12

    if display_hour == 0:
        display_hour = 12

    return (
        f"{display_hour:02d}:00 "
        f"{period}"
    )


# =========================================================
# GET ALL WARNINGS FOR ACTIVITY
# =========================================================

def get_all_warnings_for_activity(
    warning_matches,
    activity_type,
    activity_hour,
):

    matches = [
        match
        for match in warning_matches
        if (
            match.get("activity_type")
            == activity_type
            and match.get("activity_hour")
            == activity_hour
        )
    ]

    matches.sort(
        key=lambda match: IMPACT_RANK.get(
            match.get(
                "impact",
                "NONE",
            ),
            0,
        ),
        reverse=True,
    )

    return matches


# =========================================================
# GET HIGHEST WARNING
# =========================================================

def get_highest_warning_for_activity(
    warning_matches,
    activity_type,
    activity_hour,
):

    matches = get_all_warnings_for_activity(
        warning_matches=warning_matches,
        activity_type=activity_type,
        activity_hour=activity_hour,
    )

    if not matches:
        return None

    return matches[0]


# =========================================================
# MAKE FINAL DECISION
# =========================================================

def make_final_decision(
    suitability_label,
    suitability_score,
    warning_match=None,
):

    warning_impact = (
        warning_match.get(
            "impact",
            "NONE",
        )
        if warning_match
        else "NONE"
    )


    # =====================================================
    # HIGH WARNING
    # =====================================================

    if warning_impact == "HIGH":

        return {
            "status": "RECONSIDER",
            "level": "RED",
            "icon": "🔴",

            "reason": (
                f"Weather suitability is "
                f"{suitability_score}/100 "
                f"({suitability_label}), but a "
                f"high-impact "
                f"{warning_match.get('warning_title', 'weather warning')} "
                f"overlaps this activity."
            ),

            "action": warning_match.get(
                "action",
                "Consider changing the activity time.",
            ),

            "warning_override": True,
        }


    # =====================================================
    # MEDIUM WARNING
    # =====================================================

    if warning_impact == "MEDIUM":

        if suitability_label == "POOR":

            return {
                "status": "AVOID / RESCHEDULE",
                "level": "RED",
                "icon": "🔴",

                "reason": (
                    f"Weather suitability is already "
                    f"poor ({suitability_score}/100), "
                    f"and a "
                    f"{warning_match.get('warning_title', 'weather warning')} "
                    f"also affects this activity."
                ),

                "action": warning_match.get(
                    "action",
                    "Consider rescheduling this activity.",
                ),

                "warning_override": True,
            }

        return {
            "status": "USE CAUTION",
            "level": "ORANGE",
            "icon": "🟠",

            "reason": (
                f"Weather suitability is "
                f"{suitability_score}/100 "
                f"({suitability_label}), but a "
                f"weather warning may affect "
                f"this activity."
            ),

            "action": warning_match.get(
                "action",
                "Take suitable weather precautions.",
            ),

            "warning_override": True,
        }


    # =====================================================
    # LOW WARNING
    # =====================================================

    if warning_impact == "LOW":

        if suitability_label == "POOR":

            return {
                "status": "AVOID / RESCHEDULE",
                "level": "RED",
                "icon": "🔴",

                "reason": (
                    f"Normal weather suitability is "
                    f"poor ({suitability_score}/100)."
                ),

                "action": (
                    "Consider choosing a better "
                    "weather window."
                ),

                "warning_override": False,
            }

        return {
            "status": "GOOD WITH CAUTION",
            "level": "YELLOW",
            "icon": "🟡",

            "reason": (
                f"Weather suitability is "
                f"{suitability_score}/100, with a "
                f"low-impact weather advisory "
                f"affecting this activity."
            ),

            "action": warning_match.get(
                "action",
                "Stay aware of changing weather conditions.",
            ),

            "warning_override": True,
        }


    # =====================================================
    # NO WARNING + GOOD
    # =====================================================

    if suitability_label == "GOOD":

        return {
            "status": "GOOD TO GO",
            "level": "GREEN",
            "icon": "🟢",

            "reason": (
                f"Weather suitability is favorable "
                f"at {suitability_score}/100 and no "
                f"relevant warning overlaps this activity."
            ),

            "action": (
                "No weather-related schedule "
                "change is needed."
            ),

            "warning_override": False,
        }


    # =====================================================
    # NO WARNING + MODERATE
    # =====================================================

    if suitability_label == "MODERATE":

        return {
            "status": "FAIR",
            "level": "YELLOW",
            "icon": "🟡",

            "reason": (
                f"Weather suitability is moderate "
                f"at {suitability_score}/100."
            ),

            "action": (
                "Check the limiting weather factors "
                "and adjust if needed."
            ),

            "warning_override": False,
        }


    # =====================================================
    # NO WARNING + POOR
    # =====================================================

    return {
        "status": "AVOID / RESCHEDULE",
        "level": "RED",
        "icon": "🔴",

        "reason": (
            f"Weather suitability is poor at "
            f"{suitability_score}/100."
        ),

        "action": (
            "Consider moving this activity to a "
            "better weather window."
        ),

        "warning_override": False,
    }


# =========================================================
# CHECK WARNING ACTIVE AT HOUR
# =========================================================

def warning_active_at_hour(
    warning,
    hour,
):

    start_hour = warning.get(
        "start_hour"
    )

    end_hour = warning.get(
        "end_hour"
    )

    if (
        start_hour is None
        or end_hour is None
    ):
        return False


    # Normal range
    if start_hour <= end_hour:

        return (
            start_hour
            <= hour
            <= end_hour
        )


    # Cross-midnight range
    return (
        hour >= start_hour
        or hour <= end_hour
    )


# =========================================================
# GET WARNING IMPACT AT CANDIDATE HOUR
# =========================================================

def get_candidate_warning_impact(
    warnings,
    activity_type,
    activity_config,
    candidate_hour,
):

    highest_impact = "NONE"
    highest_warning = None

    intensity = activity_config.get(
        "intensity",
        "moderate",
    )


    for warning in warnings:

        if not warning_active_at_hour(
            warning,
            candidate_hour,
        ):
            continue


        warning_type = (
            warning.get(
                "type",
                "",
            )
            .lower()
        )

        severity = (
            warning.get(
                "severity",
                "",
            )
            .upper()
        )

        impact = "LOW"


        # =================================================
        # THUNDERSTORM
        # =================================================

        if warning_type == "thunderstorm":

            outdoor_activities = {
                "running",
                "cycling",
                "cricket",
                "gardening",
                "outdoor_event",
                "beach_visit",
                "walking",
                "college_commute",
            }

            if (
                activity_type
                in outdoor_activities
            ):
                impact = "HIGH"

            else:
                impact = "MEDIUM"


        # =================================================
        # HEAT
        # =================================================

        elif warning_type == "heat":

            if intensity == "high":
                impact = "HIGH"

            else:
                impact = "MEDIUM"


        # =================================================
        # RAIN
        # =================================================

        elif warning_type in (
            "rain",
            "heavy_rain",
        ):

            rain_sensitive = {
                "running",
                "cycling",
                "cricket",
                "gardening",
                "outdoor_event",
                "beach_visit",
                "walking",
                "college_commute",
            }

            if (
                activity_type
                in rain_sensitive
            ):
                impact = "HIGH"

            else:
                impact = "MEDIUM"


        # =================================================
        # WIND
        # =================================================

        elif warning_type in (
            "wind",
            "strong_wind",
        ):

            wind_sensitive = {
                "cycling",
                "cricket",
                "outdoor_event",
                "beach_visit",
            }

            if (
                activity_type
                in wind_sensitive
            ):
                impact = "HIGH"

            else:
                impact = "MEDIUM"


        # =================================================
        # FOG / VISIBILITY
        # =================================================

        elif warning_type in (
            "fog",
            "visibility",
        ):

            travel_sensitive = {
                "cycling",
                "college_commute",
            }

            if (
                activity_type
                in travel_sensitive
            ):
                impact = "HIGH"

            else:
                impact = "MEDIUM"


        # =================================================
        # AIR QUALITY
        # =================================================

        elif warning_type in (
            "aqi",
            "air_quality",
        ):

            if intensity == "high":
                impact = "HIGH"

            else:
                impact = "MEDIUM"


        # =================================================
        # GENERIC WARNING
        # =================================================

        else:

            if severity in (
                "RED",
                "ORANGE",
            ):
                impact = "HIGH"

            elif severity == "YELLOW":
                impact = "MEDIUM"

            else:
                impact = "LOW"


        # =================================================
        # KEEP HIGHEST IMPACT
        # =================================================

        if (
            IMPACT_RANK.get(
                impact,
                0,
            )
            >
            IMPACT_RANK.get(
                highest_impact,
                0,
            )
        ):

            highest_impact = impact
            highest_warning = warning


    return (
        highest_impact,
        highest_warning,
    )


# =========================================================
# FIND SAFE + FREE BETTER WINDOW
# =========================================================

def find_safe_better_window(
    activity_config,
    hourly_forecast,
    warnings,
    activity_type,
    current_hour,
    current_score,
    profile_config=None,
    occupied_hours=None,
    reserved_hours=None,
):
    """
    Find safe, better and conflict-free alternatives.

    Returns:
    - best overall option
    - best earlier option
    - best later option
    """

    candidates = []

    occupied_hours = set(
        occupied_hours or []
    )

    reserved_hours = set(
        reserved_hours or []
    )

    total_hours = min(
        24,
        len(hourly_forecast),
    )

    for hour in range(total_hours):

        # Same current time
        if hour == current_hour:
            continue

        # Another activity is already planned here
        if hour in occupied_hours:
            continue

        # Another recommendation already uses this time
        if hour in reserved_hours:
            continue

        hour_data = hourly_forecast[hour]

        (
            score,
            label,
            _,
            _,
        ) = compute_activity_score(
            activity_config,
            hour_data,
            profile_config,
        )

        # Require meaningful improvement
        if score < current_score + 10:
            continue

        # Never recommend poor conditions
        if label == "POOR":
            continue

        (
            warning_impact,
            warning,
        ) = get_candidate_warning_impact(
            warnings=warnings,
            activity_type=activity_type,
            activity_config=activity_config,
            candidate_hour=hour,
        )

        # Do not recommend warning-affected periods
        if warning_impact in (
            "MEDIUM",
            "HIGH",
        ):
            continue

        candidates.append(
            {
                "hour": hour,
                "hour_string": f"{hour:02d}:00",
                "score": score,
                "label": label,
                "warning_impact": warning_impact,
                "warning_title": (
                    warning.get("title")
                    if warning
                    else None
                ),
            }
        )

    if not candidates:
        return None

    # -----------------------------------------------------
    # HELPER: FORMAT CANDIDATE
    # -----------------------------------------------------

    def make_window(candidate, direction):

        if candidate is None:
            return None

        display_time = format_time(
            candidate["hour"]
        )

        return {
            "direction": direction,

            "suggested_hour":
                candidate["hour_string"],

            "suggested_score":
                candidate["score"],

            "suggested_label":
                candidate["label"],

            "warning_impact":
                candidate["warning_impact"],

            "reason": (
                f"{display_time} has better weather "
                f"suitability "
                f"({candidate['score']}/100), "
                f"is free in your current plan, "
                f"and has no important overlapping "
                f"weather warning."
            ),
        }

    # -----------------------------------------------------
    # EARLIER OPTIONS
    # -----------------------------------------------------

    earlier_candidates = [
        item
        for item in candidates
        if item["hour"] < current_hour
    ]

    # Closest earlier time first.
    earlier_candidates.sort(
        key=lambda item: (
            current_hour - item["hour"],
            -item["score"],
        )
    )

    best_earlier = (
        earlier_candidates[0]
        if earlier_candidates
        else None
    )

    # -----------------------------------------------------
    # LATER OPTIONS
    # -----------------------------------------------------

    later_candidates = [
        item
        for item in candidates
        if item["hour"] > current_hour
    ]

    # Closest later time first.
    later_candidates.sort(
        key=lambda item: (
            item["hour"] - current_hour,
            -item["score"],
        )
    )

    best_later = (
        later_candidates[0]
        if later_candidates
        else None
    )

    # -----------------------------------------------------
    # BEST OVERALL
    # -----------------------------------------------------

    candidates.sort(
        key=lambda item: (
            abs(
                item["hour"]
                - current_hour
            ),
            -item["score"],
        )
    )

    best_overall = candidates[0]

    return {
        # Keep these old fields so the current frontend
        # continues working without any change yet.
        "suggested_hour":
            best_overall["hour_string"],

        "suggested_score":
            best_overall["score"],

        "suggested_label":
            best_overall["label"],

        "warning_impact":
            best_overall["warning_impact"],

        "reason": (
            f"{format_time(best_overall['hour'])} "
            f"has better weather suitability "
            f"({best_overall['score']}/100), "
            f"does not conflict with another "
            f"planned activity, and has no important "
            f"overlapping weather warning."
        ),

        # New two-sided alternatives.
        "earlier":
            make_window(
                best_earlier,
                "EARLIER",
            ),

        "later":
            make_window(
                best_later,
                "LATER",
            ),
    }
# =========================================================
# BUILD COMBINED DECISION TEXT
# =========================================================

def build_combined_decision_text(
    activity,
    active_warnings,
    decision,
    better_window,
):

    score = activity["score"]
    label = activity["label"]

    activity_label = activity.get(
        "activity_label",
        "this activity",
    )

    warning_count = len(
        active_warnings
    )


    # =====================================================
    # REASON
    # =====================================================

    if warning_count == 0:

        reason = decision["reason"]


    elif warning_count == 1:

        warning = active_warnings[0]

        warning_title = warning.get(
            "title",
            "Weather warning",
        )

        warning_impact = warning.get(
            "impact",
            "MEDIUM",
        )

        reason = (
            f"Weather suitability is "
            f"{score}/100 ({label}), but "
            f"{warning_title} has a "
            f"{warning_impact.lower()} impact "
            f"on this activity."
        )


    else:

        warning_names = [
            warning.get(
                "title",
                "Weather warning",
            )
            for warning
            in active_warnings
        ]


        if len(warning_names) == 2:

            warning_text = (
                f"{warning_names[0]} and "
                f"{warning_names[1]}"
            )

        else:

            warning_text = (
                ", ".join(
                    warning_names[:-1]
                )
                + f", and "
                f"{warning_names[-1]}"
            )


        high_count = sum(
            1
            for warning
            in active_warnings
            if warning.get(
                "impact"
            ) == "HIGH"
        )

        medium_count = sum(
            1
            for warning
            in active_warnings
            if warning.get(
                "impact"
            ) == "MEDIUM"
        )


        if high_count == warning_count:

            impact_text = (
                "high-impact"
            )

        elif high_count > 0:

            impact_text = (
                "weather warnings, including "
                "high-impact conditions"
            )

        elif medium_count > 0:

            impact_text = (
                "relevant"
            )

        else:

            impact_text = (
                "low-impact"
            )


        reason = (
            f"Weather suitability is "
            f"{score}/100 ({label}), but "
            f"{warning_count} "
            f"{impact_text} warnings "
            f"overlap this activity: "
            f"{warning_text}."
        )


    # =====================================================
    # ACTION
    # =====================================================

    if better_window:

        earlier = better_window.get(
            "earlier"
        )

        later = better_window.get(
            "later"
        )


        # =============================================
        # BOTH EARLIER + LATER
        # =============================================

        if earlier and later:

            earlier_time = format_time(
                earlier.get(
                    "suggested_hour"
                )
            )

            later_time = format_time(
                later.get(
                    "suggested_hour"
                )
            )

            action = (
                f"Safer options are available for "
                f"{activity_label}: "
                f"{earlier_time} earlier or "
                f"{later_time} later. "
                f"Choose the time that best fits "
                f"your schedule."
            )


        # =============================================
        # ONLY EARLIER
        # =============================================

        elif earlier:

            earlier_time = format_time(
                earlier.get(
                    "suggested_hour"
                )
            )

            earlier_score = earlier.get(
                "suggested_score"
            )

            earlier_label = earlier.get(
                "suggested_label"
            )

            action = (
                f"A safer earlier option is available "
                f"for {activity_label} at "
                f"{earlier_time}. "
                f"Conditions improve to "
                f"{earlier_score}/100 "
                f"({earlier_label}), with no important "
                f"weather warning overlapping that time."
            )


        # =============================================
        # ONLY LATER
        # =============================================

        elif later:

            later_time = format_time(
                later.get(
                    "suggested_hour"
                )
            )

            later_score = later.get(
                "suggested_score"
            )

            later_label = later.get(
                "suggested_label"
            )

            action = (
                f"A safer later option is available "
                f"for {activity_label} at "
                f"{later_time}. "
                f"Conditions improve to "
                f"{later_score}/100 "
                f"({later_label}), with no important "
                f"weather warning overlapping that time."
            )


        # =============================================
        # OLD BACKEND FALLBACK
        # =============================================

        else:

            suggested_hour = (
                better_window.get(
                    "suggested_hour"
                )
            )

            suggested_score = (
                better_window.get(
                    "suggested_score"
                )
            )

            suggested_label = (
                better_window.get(
                    "suggested_label"
                )
            )

            display_time = format_time(
                suggested_hour
            )

            action = (
                f"Consider moving "
                f"{activity_label} to "
                f"{display_time}. "
                f"Conditions improve to "
                f"{suggested_score}/100 "
                f"({suggested_label}), with no important "
                f"weather warning overlapping that time."
            )


    elif warning_count > 0:

        action = active_warnings[
            0
        ].get(
            "action"
        )

        if not action:
            action = decision[
                "action"
            ]


    else:

        action = decision[
            "action"
        ]


    return (
        reason,
        action,
    )

# =========================================================
# BUILD FINAL RECOMMENDATIONS
# =========================================================

def build_final_recommendations(
    planner_result,
    warning_result,
    hourly_forecast,
    activity_types,
    warnings,
    profile_config=None,
):

    recommendations = []

    warning_matches = (
        warning_result.get(
            "matches",
            [],
        )
    )


    # =====================================================
    # BUILD OCCUPIED-HOUR SET
    # =====================================================

    occupied_hours = set()

    for planned_activity in planner_result.get(
        "activities",
        [],
    ):

        planned_hour = (
            planned_activity.get(
                "hour"
            )
        )

        if planned_hour is None:
            continue

        try:

            hour_number = int(
                str(
                    planned_hour
                ).split(":")[0]
            )

            occupied_hours.add(
                hour_number
            )

        except (
            ValueError,
            TypeError,
        ):
            continue


    # New safer times already assigned to
    # another recommendation.
    reserved_hours = set()


    # =====================================================
    # PROCESS EVERY ACTIVITY
    # =====================================================

    for activity in planner_result.get(
        "activities",
        [],
    ):

        activity_type = (
            activity.get(
                "activity_type"
            )
        )

        activity_hour = (
            activity.get(
                "hour"
            )
        )


        # =================================================
        # WARNINGS FOR THIS ACTIVITY
        # =================================================

        activity_warning_matches = (
            get_all_warnings_for_activity(
                warning_matches=
                    warning_matches,

                activity_type=
                    activity_type,

                activity_hour=
                    activity_hour,
            )
        )


        warning_match = (
            activity_warning_matches[0]
            if activity_warning_matches
            else None
        )


        # =================================================
        # FINAL DECISION
        # =================================================

        decision = make_final_decision(
            suitability_label=
                activity["label"],

            suitability_score=
                activity["score"],

            warning_match=
                warning_match,
        )


        # =================================================
        # CURRENT HOUR
        # =================================================

        current_hour = int(
            str(
                activity_hour
            ).split(":")[0]
        )


        # =================================================
        # SAFE + FREE BETTER WINDOW
        # =================================================

        safe_better_window = (
            find_safe_better_window(
                activity_config=
                    activity_types[
                        activity_type
                    ],

                hourly_forecast=
                    hourly_forecast,

                warnings=
                    warnings,

                activity_type=
                    activity_type,

                current_hour=
                    current_hour,

                current_score=
                    activity["score"],

                profile_config=
                    profile_config,

                occupied_hours=
                    occupied_hours,

                reserved_hours=
                    reserved_hours,
            )
        )


        # Reserve this suggestion so another
        # recommendation cannot use it.
        if safe_better_window:

            suggested_hour = (
                safe_better_window.get(
                    "suggested_hour"
                )
            )

            if suggested_hour:

                try:

                    reserved_hours.add(
                        int(
                            suggested_hour.split(
                                ":"
                            )[0]
                        )
                    )

                except (
                    ValueError,
                    TypeError,
                ):
                    pass


        # =================================================
        # FORMAT ACTIVE WARNINGS
        # =================================================

        active_warnings = []

        for match in (
            activity_warning_matches
        ):

            active_warnings.append(
                {
                    "warning_id":
                        match.get(
                            "warning_id"
                        ),

                    "type":
                        match.get(
                            "warning_type"
                        ),

                    "title":
                        match.get(
                            "warning_title"
                        ),

                    "severity":
                        match.get(
                            "warning_severity"
                        ),

                    "impact":
                        match.get(
                            "impact"
                        ),

                    "action":
                        match.get(
                            "action"
                        ),
                }
            )


        # =================================================
        # FINAL USER-FRIENDLY TEXT
        # =================================================

        (
            final_reason,
            final_action,
        ) = build_combined_decision_text(
            activity=activity,
            active_warnings=active_warnings,
            decision=decision,
            better_window=safe_better_window,
        )


        # =================================================
        # FINAL RESULT
        # =================================================

        recommendations.append(
            {
                "activity_type":
                    activity_type,

                "activity_label":
                    activity.get(
                        "activity_label"
                    ),

                "icon":
                    activity.get(
                        "icon"
                    ),

                # Keep API time unchanged
                "hour":
                    activity_hour,


                "suitability_score":
                    activity.get(
                        "score"
                    ),

                "suitability_label":
                    activity.get(
                        "label"
                    ),


                "warning_impact":
                    (
                        warning_match.get(
                            "impact",
                            "NONE",
                        )
                        if warning_match
                        else "NONE"
                    ),

                "warning_title":
                    (
                        warning_match.get(
                            "warning_title"
                        )
                        if warning_match
                        else None
                    ),


                "warning_count":
                    len(
                        active_warnings
                    ),

                "active_warnings":
                    active_warnings,


                "final_status":
                    decision["status"],

                "final_level":
                    decision["level"],

                "final_icon":
                    decision["icon"],

                "reason":
                    final_reason,

                "action":
                    final_action,

                "warning_override":
                    decision[
                        "warning_override"
                    ],


                "better_window":
                    safe_better_window,
            }
        )


    return recommendations


# =========================================================
# BUILD OVERALL DAY SUMMARY
# =========================================================

def build_overall_day_summary(recommendations):

    if not recommendations:
        return {
            "overall_status": "READY",
            "overall_level": "GREEN",
            "overall_icon": "🟢",
            "overall_summary": (
                "No activities have been added "
                "to today's plan yet."
            ),
        }


    # =====================================================
    # GROUP ACTIVITIES BY FINAL LEVEL
    # =====================================================

    red_items = [
        item
        for item in recommendations
        if item.get("final_level") == "RED"
    ]

    orange_items = [
        item
        for item in recommendations
        if item.get("final_level") == "ORANGE"
    ]

    green_items = [
        item
        for item in recommendations
        if item.get("final_level") == "GREEN"
    ]


    # =====================================================
    # RED — ACTION NEEDED
    # =====================================================

    if red_items:

        serious_items = red_items

        activity_parts = []

        for item in serious_items:

            activity_label = item.get(
                "activity_label",
                "Activity",
            )

            activity_time = format_time(
                item.get("hour")
            )

            activity_parts.append(
                f"{activity_label} at {activity_time}"
            )


        # ---------------------------------------------
        # BUILD ACTIVITY TEXT
        # ---------------------------------------------

        if len(activity_parts) == 1:

            activity_text = activity_parts[0]

        elif len(activity_parts) == 2:

            activity_text = (
                f"{activity_parts[0]} and "
                f"{activity_parts[1]}"
            )

        else:

            activity_text = (
                ", ".join(
                    activity_parts[:-1]
                )
                + f", and {activity_parts[-1]}"
            )


        # ---------------------------------------------
        # CHECK SAFER OPTIONS
        # ---------------------------------------------

        activities_with_safer_options = 0

        for item in serious_items:

            better_window = item.get(
                "better_window"
            )

            if not better_window:
                continue


            earlier = better_window.get(
                "earlier"
            )

            later = better_window.get(
                "later"
            )


            # New Earlier / Later structure
            if earlier or later:

                activities_with_safer_options += 1


            # Old single-window fallback
            elif better_window.get(
                "suggested_hour"
            ):

                activities_with_safer_options += 1


        # ---------------------------------------------
        # BUILD SUMMARY
        # ---------------------------------------------

        if len(serious_items) == 1:

            summary = (
                f"{activity_text} needs attention."
            )

        else:

            summary = (
                f"{activity_text} need attention."
            )


        # ---------------------------------------------
        # SAFER OPTION SUMMARY
        # ---------------------------------------------

        if activities_with_safer_options > 0:

            if (
                activities_with_safer_options
                == len(serious_items)
            ):

                if len(serious_items) == 1:

                    summary += (
                        " Safer alternative times are "
                        "available for this activity."
                    )

                else:

                    summary += (
                        " Safer alternative times are "
                        "available for all affected "
                        "activities."
                    )

            else:

                summary += (
                    " Safer alternative times are "
                    "available for some affected "
                    "activities."
                )

        else:

            summary += (
                " Review the affected activities "
                "before continuing with your plans."
            )


        return {
            "overall_status": "ACTION NEEDED",
            "overall_level": "RED",
            "overall_icon": "🔴",
            "overall_summary": summary,
        }


    # =====================================================
    # ORANGE — USE CAUTION
    # =====================================================

    if orange_items:

        activity_parts = []

        for item in orange_items:

            activity_label = item.get(
                "activity_label",
                "Activity",
            )

            activity_time = format_time(
                item.get("hour")
            )

            activity_parts.append(
                f"{activity_label} at {activity_time}"
            )


        if len(activity_parts) == 1:

            activity_text = activity_parts[0]

            summary = (
                f"{activity_text} needs some weather "
                f"awareness, but no major schedule "
                f"change is currently required."
            )

        elif len(activity_parts) == 2:

            activity_text = (
                f"{activity_parts[0]} and "
                f"{activity_parts[1]}"
            )

            summary = (
                f"{activity_text} need some weather "
                f"awareness, but no major schedule "
                f"changes are currently required."
            )

        else:

            activity_text = (
                ", ".join(
                    activity_parts[:-1]
                )
                + f", and {activity_parts[-1]}"
            )

            summary = (
                f"{activity_text} need some weather "
                f"awareness, but no major schedule "
                f"changes are currently required."
            )


        return {
            "overall_status": "USE CAUTION",
            "overall_level": "ORANGE",
            "overall_icon": "🟠",
            "overall_summary": summary,
        }


    # =====================================================
    # GREEN — READY
    # =====================================================

    if green_items:

        if len(green_items) == 1:

            summary = (
                "Your planned activity has favorable "
                "weather conditions and no important "
                "weather warning currently requires "
                "a schedule change."
            )

        else:

            summary = (
                "Your planned activities have favorable "
                "weather conditions and no important "
                "weather warning currently requires "
                "a schedule change."
            )


        return {
            "overall_status": "READY",
            "overall_level": "GREEN",
            "overall_icon": "🟢",
            "overall_summary": summary,
        }


    # =====================================================
    # FALLBACK
    # =====================================================

    return {
        "overall_status": "READY",
        "overall_level": "GREEN",
        "overall_icon": "🟢",
        "overall_summary": (
            "Your day currently looks suitable "
            "for the activities you have planned."
        ),
    }