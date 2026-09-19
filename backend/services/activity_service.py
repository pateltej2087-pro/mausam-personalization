"""
Activity Suitability Engine + Weather Action Engine.

compute_activity_score():
Turns one hour of weather into a transparent 0-100 score with
a per-factor breakdown and plain-language explanation.

suggest_better_window():
If the score is not good, searches nearby hours and recommends
a genuinely better time only when one exists.
"""


# ---------------------------------------------------------
# AQI CONFIGURATION
# ---------------------------------------------------------

AQI_CATEGORY_THRESHOLDS = [
    (50, "Good"),
    (100, "Satisfactory"),
    (150, "Moderately Polluted"),
    (200, "Poor"),
    (300, "Very Poor"),
    (10_000, "Severe"),
]

AQI_CATEGORY_SCORES = {
    "Good": 100,
    "Satisfactory": 85,
    "Moderately Polluted": 60,
    "Poor": 35,
    "Very Poor": 15,
    "Severe": 5,
}


# ---------------------------------------------------------
# IDEAL TEMPERATURE RANGES
# ---------------------------------------------------------

IDEAL_TEMP_RANGES = {
    "high": (16, 23),
    "moderate": (18, 29),
    "low": (20, 32),
}


# ---------------------------------------------------------
# DISPLAY NAMES
# ---------------------------------------------------------

FACTOR_NAMES = {
    "temperature": "Temperature",
    "humidity": "Humidity",
    "rain": "Rain",
    "wind": "Wind",
    "aqi": "Air Quality",
    "visibility": "Visibility",
}


# ---------------------------------------------------------
# INDIVIDUAL WEATHER FACTOR SCORING
# ---------------------------------------------------------

def _aqi_category(aqi: int) -> str:

    for threshold, category in AQI_CATEGORY_THRESHOLDS:

        if aqi <= threshold:
            return category

    return "Severe"


def score_temperature(
    temp_c: float,
    intensity: str
):

    low, high = IDEAL_TEMP_RANGES.get(
        intensity,
        IDEAL_TEMP_RANGES["moderate"]
    )

    if low <= temp_c <= high:

        return (
            100,
            f"{temp_c}°C is comfortable for this activity."
        )

    if temp_c < low:

        distance = low - temp_c

        score = max(
            0,
            round(
                100 - distance * 6
            )
        )

        return (
            score,
            f"{temp_c}°C is cooler than ideal "
            f"({low}-{high}°C) — may feel cold."
        )

    distance = temp_c - high

    score = max(
        0,
        round(
            100 - distance * 6
        )
    )

    return (
        score,
        f"{temp_c}°C is warmer than ideal "
        f"({low}-{high}°C) — may feel hot/strenuous."
    )


def score_humidity(
    humidity_pct: int
):

    if humidity_pct <= 50:

        return (
            100,
            f"Humidity is comfortable at {humidity_pct}%."
        )

    if humidity_pct <= 70:

        score = round(
            100 -
            (humidity_pct - 50) * 1.5
        )

        return (
            score,
            f"Humidity is a bit high at "
            f"{humidity_pct}%, may feel muggy."
        )

    score = max(
        0,
        round(
            70 -
            (humidity_pct - 70) * 2.5
        )
    )

    return (
        score,
        f"Humidity is high at "
        f"{humidity_pct}%, likely uncomfortable."
    )


def score_rain(
    rain_probability_pct: int
):

    score = max(
        0,
        round(
            100 -
            rain_probability_pct * 1.1
        )
    )

    if rain_probability_pct < 20:
        note = "Low chance of rain"

    elif rain_probability_pct < 45:
        note = "Moderate chance of rain"

    else:
        note = "High chance of rain"

    return (
        score,
        f"{note} "
        f"({rain_probability_pct}% probability)."
    )


def score_wind(
    wind_kmph: float
):

    if wind_kmph <= 15:

        return (
            100,
            f"Winds are light at "
            f"{wind_kmph} km/h."
        )

    if wind_kmph <= 30:

        score = round(
            100 -
            (wind_kmph - 15) * 3
        )

        return (
            score,
            f"Winds are moderate at "
            f"{wind_kmph} km/h."
        )

    score = max(
        0,
        round(
            55 -
            (wind_kmph - 30) * 3
        )
    )

    return (
        score,
        f"Winds are strong at "
        f"{wind_kmph} km/h."
    )


def score_aqi(
    aqi: int
):

    category = _aqi_category(
        aqi
    )

    return (
        AQI_CATEGORY_SCORES[
            category
        ],
        f"Air quality is "
        f"'{category}' "
        f"(AQI {aqi})."
    )


def score_visibility(
    visibility_km: float
):

    if visibility_km >= 8:

        return (
            100,
            f"Visibility is good at "
            f"{visibility_km} km."
        )

    if visibility_km >= 5:

        return (
            80,
            f"Visibility is slightly reduced "
            f"at {visibility_km} km."
        )

    if visibility_km >= 3:

        return (
            55,
            f"Visibility is noticeably reduced "
            f"at {visibility_km} km."
        )

    if visibility_km >= 1:

        return (
            30,
            f"Visibility is poor at "
            f"{visibility_km} km."
        )

    return (
        10,
        f"Visibility is very poor at "
        f"{visibility_km} km."
    )


# ---------------------------------------------------------
# FACTOR → SCORING FUNCTION
# ---------------------------------------------------------

FACTOR_SCORERS = {

    "temperature":
        lambda hd, intensity:
        score_temperature(
            hd.temperature_c,
            intensity
        ),

    "humidity":
        lambda hd, intensity:
        score_humidity(
            hd.humidity_percent
        ),

    "rain":
        lambda hd, intensity:
        score_rain(
            hd.rain_probability_percent
        ),

    "wind":
        lambda hd, intensity:
        score_wind(
            hd.wind_speed_kmph
        ),

    "aqi":
        lambda hd, intensity:
        score_aqi(
            hd.aqi
        ),

    "visibility":
        lambda hd, intensity:
        score_visibility(
            hd.visibility_km
        ),
}


# ---------------------------------------------------------
# NORMALIZE WEIGHTS
# ---------------------------------------------------------

def normalize_weights(
    weights: dict
):

    total = sum(
        weights.values()
    ) or 1

    return {
        factor:
            weight / total

        for factor, weight
        in weights.items()
    }


# ---------------------------------------------------------
# PROFILE PERSONALIZATION DETAILS
# ---------------------------------------------------------

def build_personalization_details(
    activity_config: dict,
    profile_config: dict | None
):

    if not profile_config:

        return {
            "applied": False,
            "profile_label": None,
            "prioritized_factors": [],
            "summary": (
                "Standard activity-based weather "
                "weights were used."
            ),
        }


    base_weights = (
        activity_config["weights"]
    )

    base_normalized = (
        normalize_weights(
            base_weights
        )
    )


    multipliers = (
        profile_config.get(
            "factor_multipliers",
            {}
        )
    )


    adjusted_weights = {}

    for factor, base_weight in (
        base_weights.items()
    ):

        adjusted_weights[factor] = (
            base_weight *
            multipliers.get(
                factor,
                1.0
            )
        )


    adjusted_normalized = (
        normalize_weights(
            adjusted_weights
        )
    )


    factor_changes = []

    for factor in base_weights:

        base_percent = round(
            base_normalized[factor] * 100
        )

        personalized_percent = round(
            adjusted_normalized[factor] * 100
        )

        difference = (
            personalized_percent -
            base_percent
        )

        factor_changes.append({
            "factor": factor,

            "label":
                FACTOR_NAMES.get(
                    factor,
                    factor
                ),

            "base_weight_percent":
                base_percent,

            "personalized_weight_percent":
                personalized_percent,

            "change_percent":
                difference,
        })


    # Largest increases first.
    prioritized = sorted(
        [
            item
            for item in factor_changes
            if item["change_percent"] > 0
        ],
        key=lambda item:
            item["change_percent"],
        reverse=True,
    )


    # If rounding causes every change to appear
    # as zero, use multiplier strength instead.
    if not prioritized:

        prioritized = sorted(
            factor_changes,
            key=lambda item:
                multipliers.get(
                    item["factor"],
                    1.0
                ),
            reverse=True,
        )[:3]


    prioritized = prioritized[:3]


    prioritized_names = [
        item["label"]
        for item in prioritized
    ]


    profile_label = (
        profile_config.get(
            "label",
            "Selected profile"
        )
    )


    if prioritized_names:

        if len(prioritized_names) == 1:

            factor_text = (
                prioritized_names[0]
            )

        elif len(prioritized_names) == 2:

            factor_text = (
                f"{prioritized_names[0]} "
                f"and {prioritized_names[1]}"
            )

        else:

            factor_text = (
                f"{prioritized_names[0]}, "
                f"{prioritized_names[1]} "
                f"and {prioritized_names[2]}"
            )


        summary = (
            f"For the {profile_label} profile, "
            f"{factor_text} receive more emphasis "
            f"when evaluating this activity."
        )

    else:

        summary = (
            f"The {profile_label} profile was "
            f"applied to this activity's weather "
            f"weights."
        )


    return {
        "applied": True,

        "profile_label":
            profile_label,

        "prioritized_factors":
            prioritized,

        "factor_changes":
            factor_changes,

        "summary":
            summary,
    }


# ---------------------------------------------------------
# ACTIVITY SUITABILITY ENGINE
# ---------------------------------------------------------

def compute_activity_score(
    activity_config: dict,
    hour_data,
    profile_config: dict | None = None,
):

    base_weights = (
        activity_config["weights"]
    )


    # -----------------------------------------------------
    # PROFILE PERSONALIZATION
    # -----------------------------------------------------

    profile_multipliers = {}

    if profile_config:

        profile_multipliers = (
            profile_config.get(
                "factor_multipliers",
                {}
            )
        )


    personalized_weights = {}

    for factor, base_weight in (
        base_weights.items()
    ):

        multiplier = (
            profile_multipliers.get(
                factor,
                1.0
            )
        )

        personalized_weights[
            factor
        ] = (
            base_weight *
            multiplier
        )


    weights = (
        personalized_weights
    )

    intensity = (
        activity_config["intensity"]
    )

    total_weight = (
        sum(weights.values()) or 1
    )

    breakdown = []

    weighted_total = 0


    # -----------------------------------------------------
    # CALCULATE WEATHER FACTORS
    # -----------------------------------------------------

    for factor, weight in (
        weights.items()
    ):

        normalized_weight = (
            weight /
            total_weight
        )


        factor_score, reason = (
            FACTOR_SCORERS[
                factor
            ](
                hour_data,
                intensity
            )
        )


        weighted_total += (
            factor_score *
            normalized_weight
        )


        breakdown.append({

            "factor":
                factor,

            "score":
                factor_score,

            "weight_percent":
                round(
                    normalized_weight *
                    100
                ),

            "reason":
                reason,

        })


    # -----------------------------------------------------
    # FINAL SCORE
    # -----------------------------------------------------

    total_score = round(
        weighted_total
    )


    # -----------------------------------------------------
    # LABEL
    # -----------------------------------------------------

    if total_score >= 70:

        label = "GOOD"

    elif total_score >= 40:

        label = "MODERATE"

    else:

        label = "POOR"


    # -----------------------------------------------------
    # EXPLANATION ENGINE
    # -----------------------------------------------------

    if total_score >= 70:

        explanation = [
            "Conditions are broadly favorable "
            "for this activity."
        ]

    else:

        factors_with_penalty = []

        for item in breakdown:

            penalty = (
                (100 - item["score"])
                *
                (
                    item[
                        "weight_percent"
                    ] / 100
                )
            )


            factors_with_penalty.append({
                **item,
                "penalty":
                    penalty,
            })


        worst_first = sorted(
            factors_with_penalty,
            key=lambda item:
                item["penalty"],
            reverse=True,
        )


        problem_factors = [

            item

            for item in worst_first

            if (
                item["score"] < 90
                and
                item["penalty"] > 0
            )
        ]


        explanation = [

            item["reason"]

            for item
            in problem_factors[:2]
        ]


        if not explanation:

            explanation = [
                "Several small weather factors "
                "slightly reduce suitability."
            ]


    return (
        total_score,
        label,
        breakdown,
        explanation,
    )


# ---------------------------------------------------------
# WEATHER ACTION ENGINE
# ---------------------------------------------------------

def suggest_better_window(
    activity_config: dict,
    hourly_forecast: list,
    current_hour: int,
    current_score: int,
    profile_config: dict | None = None,
):

    # Conditions already good.
    if current_score >= 70:

        return None


    best_hour = None
    best_score = current_score


    # Search up to 4 hours before/after.
    for offset in range(1, 5):

        candidate_hours = (
            current_hour - offset,
            current_hour + offset,
        )


        for candidate_hour in (
            candidate_hours
        ):

            if (
                candidate_hour < 0
                or
                candidate_hour > 23
            ):

                continue


            candidate_data = (
                hourly_forecast[
                    candidate_hour
                ]
            )


            (
                candidate_score,
                _,
                _,
                _
            ) = compute_activity_score(
                activity_config,
                candidate_data,
                profile_config,
            )


            if (
                candidate_score
                >= current_score + 15
                and
                candidate_score
                > best_score
            ):

                best_hour = (
                    candidate_hour
                )

                best_score = (
                    candidate_score
                )


        if best_hour is not None:

            break


    if best_hour is None:

        return None


    return {

        "suggested_hour":
            f"{best_hour:02d}:00",

        "suggested_score":
            best_score,

        "reason": (
            f"Conditions look meaningfully better "
            f"around {best_hour:02d}:00 "
            f"({best_score}/100) than at "
            f"{current_hour:02d}:00 "
            f"({current_score}/100)."
        ),
    }