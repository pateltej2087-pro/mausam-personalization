"""
What Changed? Engine

Compares two weather snapshots and identifies changes that are
meaningful to the user instead of reporting every tiny numerical change.

Examples:
- Rain chance increased significantly
- Temperature became much hotter
- AQI became worse
- Wind became stronger
- Visibility dropped

This service contains no FastAPI code so it can later work with
real IMD observations as well as demo data.
"""


def compare_weather(previous, current):
    changes = []

    # --------------------------------
    # TEMPERATURE
    # --------------------------------

    temp_change = current.temperature_c - previous.temperature_c

    if abs(temp_change) >= 2:

        if temp_change > 0:
            changes.append({
                "factor": "temperature",
                "direction": "increased",
                "severity": _severity(abs(temp_change), 2, 5),
                "message": (
                    f"Temperature increased from "
                    f"{previous.temperature_c}°C to "
                    f"{current.temperature_c}°C."
                ),
            })

        else:
            changes.append({
                "factor": "temperature",
                "direction": "decreased",
                "severity": _severity(abs(temp_change), 2, 5),
                "message": (
                    f"Temperature dropped from "
                    f"{previous.temperature_c}°C to "
                    f"{current.temperature_c}°C."
                ),
            })


    # --------------------------------
    # RAIN PROBABILITY
    # --------------------------------

    rain_change = (
        current.rain_probability_percent
        - previous.rain_probability_percent
    )

    if abs(rain_change) >= 15:

        if rain_change > 0:
            changes.append({
                "factor": "rain",
                "direction": "increased",
                "severity": _severity(abs(rain_change), 15, 35),
                "message": (
                    f"Rain chance increased from "
                    f"{previous.rain_probability_percent}% to "
                    f"{current.rain_probability_percent}%."
                ),
            })

        else:
            changes.append({
                "factor": "rain",
                "direction": "decreased",
                "severity": _severity(abs(rain_change), 15, 35),
                "message": (
                    f"Rain chance decreased from "
                    f"{previous.rain_probability_percent}% to "
                    f"{current.rain_probability_percent}%."
                ),
            })


    # --------------------------------
    # AQI
    # --------------------------------

    aqi_change = current.aqi - previous.aqi

    if abs(aqi_change) >= 20:

        if aqi_change > 0:
            changes.append({
                "factor": "aqi",
                "direction": "worsened",
                "severity": _severity(abs(aqi_change), 20, 60),
                "message": (
                    f"Air quality worsened: AQI increased from "
                    f"{previous.aqi} to {current.aqi}."
                ),
            })

        else:
            changes.append({
                "factor": "aqi",
                "direction": "improved",
                "severity": _severity(abs(aqi_change), 20, 60),
                "message": (
                    f"Air quality improved: AQI dropped from "
                    f"{previous.aqi} to {current.aqi}."
                ),
            })


    # --------------------------------
    # WIND
    # --------------------------------

    wind_change = current.wind_speed_kmph - previous.wind_speed_kmph

    if abs(wind_change) >= 8:

        if wind_change > 0:
            changes.append({
                "factor": "wind",
                "direction": "increased",
                "severity": _severity(abs(wind_change), 8, 18),
                "message": (
                    f"Wind speed increased from "
                    f"{previous.wind_speed_kmph} km/h to "
                    f"{current.wind_speed_kmph} km/h."
                ),
            })

        else:
            changes.append({
                "factor": "wind",
                "direction": "decreased",
                "severity": _severity(abs(wind_change), 8, 18),
                "message": (
                    f"Wind speed decreased from "
                    f"{previous.wind_speed_kmph} km/h to "
                    f"{current.wind_speed_kmph} km/h."
                ),
            })


    # --------------------------------
    # VISIBILITY
    # --------------------------------

    visibility_change = (
        current.visibility_km - previous.visibility_km
    )

    if abs(visibility_change) >= 2:

        if visibility_change < 0:
            changes.append({
                "factor": "visibility",
                "direction": "worsened",
                "severity": _severity(
                    abs(visibility_change), 2, 5
                ),
                "message": (
                    f"Visibility dropped from "
                    f"{previous.visibility_km} km to "
                    f"{current.visibility_km} km."
                ),
            })

        else:
            changes.append({
                "factor": "visibility",
                "direction": "improved",
                "severity": _severity(
                    abs(visibility_change), 2, 5
                ),
                "message": (
                    f"Visibility improved from "
                    f"{previous.visibility_km} km to "
                    f"{current.visibility_km} km."
                ),
            })


    # --------------------------------
    # SORT IMPORTANT CHANGES FIRST
    # --------------------------------

    severity_order = {
        "high": 3,
        "medium": 2,
        "low": 1,
    }

    changes.sort(
        key=lambda item: severity_order[item["severity"]],
        reverse=True,
    )

    return changes


def _severity(value, medium_threshold, high_threshold):

    if value >= high_threshold:
        return "high"

    if value >= medium_threshold:
        return "medium"

    return "low"