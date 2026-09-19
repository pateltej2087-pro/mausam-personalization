from services.activity_service import (
    compute_activity_score,
    build_personalization_details,
)


# =========================================================
# BETTER FREE WINDOW
# =========================================================

def find_better_free_window(
    activity_config,
    hourly_forecast,
    current_hour,
    current_score,
    occupied_hours,
    profile_config=None,
):
    """
    Search nearby hours for a meaningfully better time.

    Rules:
    - Search within 4 hours before/after.
    - Do not recommend the same hour.
    - Do not recommend an occupied hour.
    - Candidate must improve score by at least 15 points.
    - Prefer the nearest suitable hour.
    - Use the same profile personalization.
    """

    if current_score >= 70:
        return None

    for offset in range(1, 5):

        candidates = [
            current_hour - offset,
            current_hour + offset,
        ]

        best_candidate = None

        for candidate_hour in candidates:

            # Skip invalid hours
            if (
                candidate_hour < 0
                or candidate_hour > 23
            ):
                continue

            # Skip hours already used
            if candidate_hour in occupied_hours:
                continue

            candidate_data = hourly_forecast[
                candidate_hour
            ]

            (
                candidate_score,
                candidate_label,
                _,
                _,
            ) = compute_activity_score(
                activity_config,
                candidate_data,
                profile_config,
            )

            improvement = (
                candidate_score - current_score
            )

            # Improvement must be meaningful
            if improvement < 15:
                continue

            if (
                best_candidate is None
                or candidate_score
                > best_candidate["score"]
            ):
                best_candidate = {
                    "hour": candidate_hour,
                    "score": candidate_score,
                    "label": candidate_label,
                }

        # Once we find a valid nearby hour,
        # don't search farther away.
        if best_candidate is not None:

            suggested_hour = (
                best_candidate["hour"]
            )

            suggested_score = (
                best_candidate["score"]
            )

            suggested_label = (
                best_candidate["label"]
            )

            return {
                "suggested_hour":
                    f"{suggested_hour:02d}:00",

                "suggested_score":
                    suggested_score,

                "suggested_label":
                    suggested_label,

                "reason": (
                    f"Conditions look meaningfully better "
                    f"around {suggested_hour:02d}:00 "
                    f"({suggested_score}/100) than at "
                    f"{current_hour:02d}:00 "
                    f"({current_score}/100), and this "
                    f"time does not conflict with another "
                    f"planned activity."
                ),
            }

    return None


# =========================================================
# BUILD COMPLETE DAY PLAN
# =========================================================

def build_day_plan(
    planned_activities,
    hourly_forecast,
    activity_types,
    profile_config=None,
):
    """
    Evaluate the user's complete day.

    The planner:
    1. Scores every activity.
    2. Applies profile personalization.
    3. Explains how personalization changed weights.
    4. Finds better weather windows.
    5. Avoids schedule conflicts.
    6. Generates a whole-day summary.
    """

    results = []

    good_count = 0
    moderate_count = 0
    poor_count = 0
    adjustment_count = 0


    # =====================================================
    # HOURS ALREADY OCCUPIED
    # =====================================================

    occupied_hours = {
        activity["hour"]
        for activity in planned_activities
    }


    # =====================================================
    # SCORE EACH ACTIVITY
    # =====================================================

    for planned in planned_activities:

        activity_type = planned[
            "activity_type"
        ]

        hour = planned[
            "hour"
        ]

        activity_config = activity_types[
            activity_type
        ]

        hour_data = hourly_forecast[
            hour
        ]


        # =================================================
        # PERSONALIZED WEATHER SCORE
        # =================================================

        (
            score,
            label,
            breakdown,
            explanation,
        ) = compute_activity_score(
            activity_config,
            hour_data,
            profile_config,
        )


        # =================================================
        # EXPLAIN PERSONALIZATION
        # =================================================

        personalization = (
            build_personalization_details(
                activity_config,
                profile_config,
            )
        )


        # =================================================
        # FIND BETTER NON-CONFLICTING TIME
        # =================================================

        better_window = (
            find_better_free_window(
                activity_config=
                    activity_config,

                hourly_forecast=
                    hourly_forecast,

                current_hour=
                    hour,

                current_score=
                    score,

                occupied_hours=
                    occupied_hours,

                profile_config=
                    profile_config,
            )
        )


        # =================================================
        # COUNT SCORE CATEGORIES
        # =================================================

        if label == "GOOD":
            good_count += 1

        elif label == "MODERATE":
            moderate_count += 1

        else:
            poor_count += 1


        if better_window:
            adjustment_count += 1


        # =================================================
        # SAVE ACTIVITY RESULT
        # =================================================

        results.append(
            {
                "activity_type":
                    activity_type,

                "activity_label":
                    activity_config["label"],

                "icon":
                    activity_config["icon"],

                "hour":
                    hour_data.hour,

                "score":
                    score,

                "label":
                    label,

                "explanation":
                    explanation,

                "factor_breakdown":
                    breakdown,

                "personalization":
                    personalization,

                "better_window":
                    better_window,
            }
        )


    # =====================================================
    # SORT ACTIVITIES BY TIME
    # =====================================================

    results.sort(
        key=lambda activity:
            int(
                activity[
                    "hour"
                ].split(":")[0]
            )
    )


    # =====================================================
    # DAY SUMMARY
    # =====================================================

    total = len(results)


    if total == 0:

        summary = (
            "Add activities to build your "
            "personalized weather plan."
        )


    elif (
        poor_count == 0
        and moderate_count == 0
    ):

        summary = (
            f"All {total} planned activities "
            f"have favorable weather conditions."
        )


    elif poor_count == 0:

        summary = (
            f"{good_count} of {total} activities "
            f"look good. {moderate_count} may need "
            f"some weather awareness."
        )


    else:

        summary = (
            f"{good_count} of {total} activities "
            f"look good. {moderate_count} are "
            f"moderate and {poor_count} may "
            f"need adjustment."
        )


    # =====================================================
    # ACTION MESSAGE
    # =====================================================

    if adjustment_count == 0:

        action_message = (
            "No schedule changes are currently "
            "recommended."
        )


    elif adjustment_count == 1:

        action_message = (
            "Mausam found a better, conflict-free "
            "weather window for 1 activity."
        )


    else:

        action_message = (
            f"Mausam found better, conflict-free "
            f"weather windows for "
            f"{adjustment_count} activities."
        )


    # =====================================================
    # FINAL RESULT
    # =====================================================

    return {
        "total_activities":
            total,

        "good_count":
            good_count,

        "moderate_count":
            moderate_count,

        "poor_count":
            poor_count,

        "adjustment_count":
            adjustment_count,

        "summary":
            summary,

        "action_message":
            action_message,

        "activities":
            results,
    }