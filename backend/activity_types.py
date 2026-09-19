# Per-activity sensitivity weights (0-1) across the six factors we score.
# Weights don't need to sum to exactly 1 — compute_activity_score()
# normalizes them — but keeping them near 1 makes this file easy to read.
ACTIVITY_TYPES = {
    "running": {
        "label": "Running", "icon": "🏃", "intensity": "high",
        "weights": {"temperature": 0.30, "humidity": 0.15, "rain": 0.15,
                    "wind": 0.05, "aqi": 0.30, "visibility": 0.05},
    },
    "cycling": {
        "label": "Cycling", "icon": "🚴", "intensity": "high",
        "weights": {"temperature": 0.25, "humidity": 0.10, "rain": 0.20,
                    "wind": 0.20, "aqi": 0.20, "visibility": 0.05},
    },
    "cricket": {
        "label": "Cricket / Outdoor Sport", "icon": "🏏", "intensity": "high",
        "weights": {"temperature": 0.10, "humidity": 0.05, "rain": 0.35,
                    "wind": 0.25, "aqi": 0.10, "visibility": 0.15},
    },
    "college_commute": {
        "label": "College / Commute", "icon": "🎓", "intensity": "moderate",
        "weights": {"temperature": 0.05, "humidity": 0.05, "rain": 0.30,
                    "wind": 0.05, "aqi": 0.15, "visibility": 0.40},
    },
    "gardening": {
        "label": "Gardening", "icon": "🌱", "intensity": "moderate",
        "weights": {"temperature": 0.20, "humidity": 0.15, "rain": 0.30,
                    "wind": 0.10, "aqi": 0.15, "visibility": 0.10},
    },
    "outdoor_event": {
        "label": "Outdoor Event / Picnic", "icon": "🎉", "intensity": "low",
        "weights": {"temperature": 0.20, "humidity": 0.10, "rain": 0.35,
                    "wind": 0.20, "aqi": 0.10, "visibility": 0.05},
    },
    "beach_visit": {
        "label": "Beach Visit", "icon": "🏖️", "intensity": "low",
        "weights": {"temperature": 0.20, "humidity": 0.10, "rain": 0.25,
                    "wind": 0.25, "aqi": 0.10, "visibility": 0.10},
    },
    "walking": {
        "label": "Walking / Leisure", "icon": "🚶", "intensity": "low",
        "weights": {"temperature": 0.25, "humidity": 0.15, "rain": 0.20,
                    "wind": 0.10, "aqi": 0.25, "visibility": 0.05},
    },
}

# Kept deliberately simple for Phase 2 — a user can eventually have
# multiple interests, but v1 is one profile at a time.
# ---------------------------------------------------------
# USER PROFILE TYPES
# ---------------------------------------------------------
#
# suggested_activities:
# Activities shown first for this type of user.
#
# factor_multipliers:
# Slightly adjust activity weather priorities according
# to the user's context.
#
# 1.00 = normal activity importance
# >1.00 = more important for this profile
#
# Activity weights remain the MAIN influence on scoring.
# Profile multipliers only personalize them.
# ---------------------------------------------------------

PROFILE_TYPES = {

    "student": {
        "label": "Student",
        "icon": "🎒",

        "suggested_activities": [
            "college_commute",
            "walking",
        ],

        "factor_multipliers": {
            "temperature": 1.00,
            "humidity": 1.00,
            "rain": 1.15,
            "wind": 1.00,
            "aqi": 1.05,
            "visibility": 1.15,
        },
    },


    "commuter": {
        "label": "Commuter",
        "icon": "🚗",

        "suggested_activities": [
            "college_commute",
        ],

        "factor_multipliers": {
            "temperature": 0.95,
            "humidity": 0.95,
            "rain": 1.20,
            "wind": 1.05,
            "aqi": 1.05,
            "visibility": 1.20,
        },
    },


    "fitness": {
        "label": "Fitness Enthusiast",
        "icon": "💪",

        "suggested_activities": [
            "running",
            "cycling",
        ],

        "factor_multipliers": {
            "temperature": 1.20,
            "humidity": 1.15,
            "rain": 1.00,
            "wind": 1.05,
            "aqi": 1.25,
            "visibility": 1.00,
        },
    },


    "traveller": {
        "label": "Traveller",
        "icon": "🧳",

        "suggested_activities": [
            "walking",
            "outdoor_event",
        ],

        "factor_multipliers": {
            "temperature": 1.05,
            "humidity": 1.00,
            "rain": 1.15,
            "wind": 1.05,
            "aqi": 1.00,
            "visibility": 1.15,
        },
    },


    "farmer_gardener": {
        "label": "Farmer / Gardener",
        "icon": "🌾",

        "suggested_activities": [
            "gardening",
        ],

        "factor_multipliers": {
            "temperature": 1.10,
            "humidity": 1.10,
            "rain": 1.25,
            "wind": 1.10,
            "aqi": 0.95,
            "visibility": 1.00,
        },
    },


    "parent": {
        "label": "Parent",
        "icon": "👪",

        "suggested_activities": [
            "outdoor_event",
            "walking",
        ],

        "factor_multipliers": {
            "temperature": 1.15,
            "humidity": 1.05,
            "rain": 1.15,
            "wind": 1.05,
            "aqi": 1.20,
            "visibility": 1.05,
        },
    },


    "health_conscious": {
        "label": "Health-Conscious",
        "icon": "🩺",

        "suggested_activities": [
            "running",
            "walking",
        ],

        "factor_multipliers": {
            "temperature": 1.15,
            "humidity": 1.10,
            "rain": 0.95,
            "wind": 1.00,
            "aqi": 1.35,
            "visibility": 1.00,
        },
    },


    "event_planner": {
        "label": "Event Planner",
        "icon": "📅",

        "suggested_activities": [
            "outdoor_event",
        ],

        "factor_multipliers": {
            "temperature": 1.00,
            "humidity": 1.00,
            "rain": 1.30,
            "wind": 1.20,
            "aqi": 0.95,
            "visibility": 1.10,
        },
    },


    "beach_coastal": {
        "label": "Beach / Coastal",
        "icon": "🌊",

        "suggested_activities": [
            "beach_visit",
        ],

        "factor_multipliers": {
            "temperature": 1.05,
            "humidity": 1.05,
            "rain": 1.20,
            "wind": 1.30,
            "aqi": 0.90,
            "visibility": 1.10,
        },
    },
}