"""
Personalized Warning Impact Engine.

Matches weather warnings with a user's planned activities using:

1. Warning time
2. Warning type
3. Activity type
4. Activity sensitivity

This converts a generic weather warning into a personalized
answer such as:

"Thunderstorm warning HIGH impact for Cricket at 17:00."
"""


# ==========================================
# WARNING → ACTIVITY IMPACT CONFIGURATION
# ==========================================

WARNING_ACTIVITY_IMPACT = {

    "heat": {
        "running": "HIGH",
        "cycling": "HIGH",
        "cricket": "HIGH",
        "college_commute": "LOW",
        "gardening": "MEDIUM",
        "outdoor_event": "MEDIUM",
        "beach_visit": "MEDIUM",
        "walking": "MEDIUM",
    },

    "thunderstorm": {
        "running": "HIGH",
        "cycling": "HIGH",
        "cricket": "HIGH",
        "college_commute": "MEDIUM",
        "gardening": "HIGH",
        "outdoor_event": "HIGH",
        "beach_visit": "HIGH",
        "walking": "HIGH",
    },

    "heavy_rain": {
        "running": "HIGH",
        "cycling": "HIGH",
        "cricket": "HIGH",
        "college_commute": "MEDIUM",
        "gardening": "HIGH",
        "outdoor_event": "HIGH",
        "beach_visit": "HIGH",
        "walking": "HIGH",
    },

    "strong_wind": {
        "running": "MEDIUM",
        "cycling": "HIGH",
        "cricket": "MEDIUM",
        "college_commute": "LOW",
        "gardening": "MEDIUM",
        "outdoor_event": "HIGH",
        "beach_visit": "HIGH",
        "walking": "MEDIUM",
    },

    "poor_air_quality": {
        "running": "HIGH",
        "cycling": "HIGH",
        "cricket": "HIGH",
        "college_commute": "LOW",
        "gardening": "MEDIUM",
        "outdoor_event": "MEDIUM",
        "beach_visit": "LOW",
        "walking": "MEDIUM",
    },
}


# ==========================================
# PERSONALIZED ACTION TEXT
# ==========================================

WARNING_ACTIONS = {

    "heat": {
        "HIGH": (
            "This activity involves significant outdoor exposure "
            "or physical effort. Consider moving it to a cooler hour."
        ),

        "MEDIUM": (
            "Heat may make this activity uncomfortable. "
            "Prefer shade, hydration, or a cooler time if possible."
        ),

        "LOW": (
            "The activity can continue with basic heat precautions "
            "such as hydration and limiting unnecessary exposure."
        ),
    },


    "thunderstorm": {
        "HIGH": (
            "This outdoor activity is strongly affected by "
            "thunderstorm conditions. Consider postponing it, "
            "moving indoors, or choosing another time."
        ),

        "MEDIUM": (
            "Thunderstorms may disrupt this activity or travel. "
            "Keep the schedule flexible and avoid exposed areas."
        ),

        "LOW": (
            "Monitor conditions before leaving and keep an "
            "alternative plan available."
        ),
    },


    "heavy_rain": {
        "HIGH": (
            "Heavy rain could significantly disrupt this activity. "
            "Consider rescheduling or moving it indoors."
        ),

        "MEDIUM": (
            "Rain may affect travel or comfort. Allow extra time "
            "and keep an alternative plan available."
        ),

        "LOW": (
            "Minor disruption is possible. Carry rain protection "
            "and monitor conditions."
        ),
    },


    "strong_wind": {
        "HIGH": (
            "Strong winds can significantly affect this activity. "
            "Consider postponing it or choosing a more sheltered option."
        ),

        "MEDIUM": (
            "Wind may make this activity difficult or uncomfortable. "
            "Use caution and consider a sheltered location."
        ),

        "LOW": (
            "Some wind-related disruption is possible, but the "
            "activity may continue with appropriate caution."
        ),
    },


    "poor_air_quality": {
        "HIGH": (
            "This activity involves prolonged or strenuous outdoor "
            "exposure. Consider reducing intensity, shortening it, "
            "or moving indoors."
        ),

        "MEDIUM": (
            "Consider limiting prolonged outdoor exposure and "
            "adjusting the activity if air quality feels uncomfortable."
        ),

        "LOW": (
            "Air quality may have limited impact on this activity, "
            "but prolonged outdoor exposure can still be reduced."
        ),
    },
}


# ==========================================
# SEVERITY RANKING
# ==========================================

IMPACT_RANK = {
    "NONE": 0,
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
}


# ==========================================
# TIME CHECK
# ==========================================

def warning_is_active(warning, hour):
    """
    Check whether an activity's hour falls inside
    the warning period.

    Both start and end hours are treated as inclusive.

    Example:
    warning 16 → 20
    activity 17 → active
    activity 8  → not active
    """

    start_hour = warning["start_hour"]
    end_hour = warning["end_hour"]

    return start_hour <= hour <= end_hour


# ==========================================
# GET IMPACT LEVEL
# ==========================================

def get_warning_impact(
    warning_type,
    activity_type,
):
    """
    Return HIGH / MEDIUM / LOW / NONE.
    """

    warning_config = WARNING_ACTIVITY_IMPACT.get(
        warning_type,
        {},
    )

    return warning_config.get(
        activity_type,
        "NONE",
    )


# ==========================================
# GET PERSONALIZED ACTION
# ==========================================

def get_personalized_action(
    warning_type,
    impact,
):
    """
    Return a user-friendly action based on
    warning type and impact.
    """

    warning_actions = WARNING_ACTIONS.get(
        warning_type,
        {},
    )

    return warning_actions.get(
        impact,
        "Monitor weather conditions before continuing this activity.",
    )


# ==========================================
# MATCH ONE WARNING AGAINST ONE ACTIVITY
# ==========================================

def match_warning_to_activity(
    warning,
    planned_activity,
    activity_types,
):
    """
    Compare one warning with one planned activity.

    Returns None when the warning is not active
    during the activity.

    Otherwise returns personalized impact information.
    """

    activity_type = planned_activity["activity_type"]
    hour = planned_activity["hour"]


    # Warning doesn't overlap activity time
    if not warning_is_active(
        warning,
        hour,
    ):
        return None


    activity_config = activity_types.get(
        activity_type
    )

    if activity_config is None:
        return None


    impact = get_warning_impact(
        warning["type"],
        activity_type,
    )


    if impact == "NONE":
        return None


    action = get_personalized_action(
        warning["type"],
        impact,
    )


    return {
        "warning_id":
            warning["id"],

        "warning_type":
            warning["type"],

        "warning_title":
            warning["title"],

        "warning_severity":
            warning["severity"],

        "activity_type":
            activity_type,

        "activity_label":
            activity_config["label"],

        "activity_icon":
            activity_config["icon"],

        "activity_hour":
            f"{hour:02d}:00",

        "impact":
            impact,

        "action":
            action,
    }


# ==========================================
# ANALYSE ALL WARNINGS AGAINST USER'S DAY
# ==========================================

def analyse_warning_impacts(
    warnings,
    planned_activities,
    activity_types,
):
    """
    Compare every active warning with every
    planned activity.

    Returns:
    - all warnings
    - personalized matches
    - number of affected activities
    - highest impact
    - summary
    """

    matches = []


    # ==========================================
    # WARNING × ACTIVITY MATCHING
    # ==========================================

    for warning in warnings:

        for activity in planned_activities:

            match = match_warning_to_activity(
                warning=warning,
                planned_activity=activity,
                activity_types=activity_types,
            )

            if match:
                matches.append(match)


    # ==========================================
    # UNIQUE AFFECTED ACTIVITIES
    # ==========================================

    affected_activity_keys = {
        (
            match["activity_type"],
            match["activity_hour"],
        )
        for match in matches
    }

    affected_count = len(
        affected_activity_keys
    )


    # ==========================================
    # HIGHEST IMPACT
    # ==========================================

    if matches:

        highest_impact = max(
            (
                match["impact"]
                for match in matches
            ),
            key=lambda impact:
                IMPACT_RANK.get(
                    impact,
                    0,
                ),
        )

    else:

        highest_impact = "NONE"


    # ==========================================
    # SUMMARY
    # ==========================================

    if not warnings:

        summary = (
            "No weather warnings are available "
            "for this location."
        )

    elif not matches:

        summary = (
            "Weather warnings are present, but none "
            "overlap your planned activities."
        )

    elif affected_count == 1:

        summary = (
            "1 planned activity may be affected "
            "by a weather warning."
        )

    else:

        summary = (
            f"{affected_count} planned activities "
            f"may be affected by weather warnings."
        )


    # ==========================================
    # RETURN
    # ==========================================

    return {
        "warning_count":
            len(warnings),

        "affected_activity_count":
            affected_count,

        "highest_impact":
            highest_impact,

        "summary":
            summary,

        "warnings":
            warnings,

        "matches":
            matches,
    }