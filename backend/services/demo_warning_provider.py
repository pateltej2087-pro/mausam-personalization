from services.warning_provider import WarningProvider


class DemoWarningProvider(WarningProvider):
    """
    Provides simulated weather warnings for prototype testing.

    IMPORTANT:
    These are NOT live or official IMD warnings.

    The purpose is to test how the Mausam personalization
    engine can connect weather warnings with a user's
    location, activities, and schedule.
    """

    @property
    def source_name(self) -> str:
        return "DEMO_WARNING"


    def get_warnings(self, location: str):
        key = location.strip().lower()

        warnings = {
            # ==========================================
            # AHMEDABAD
            # ==========================================

            "ahmedabad": [
                {
                    "id": "AMD-HEAT-001",

                    "type": "heat",

                    "title": "Heat Alert",

                    "severity": "ORANGE",

                    "start_hour": 12,

                    "end_hour": 17,

                    "message": (
                        "Very hot conditions are simulated "
                        "during the afternoon."
                    ),

                    "recommended_action": (
                        "Limit strenuous outdoor activity, "
                        "stay hydrated, and prefer cooler hours."
                    ),
                },

                {
                    "id": "AMD-STORM-001",

                    "type": "thunderstorm",

                    "title": "Thunderstorm Watch",

                    "severity": "YELLOW",

                    "start_hour": 16,

                    "end_hour": 20,

                    "message": (
                        "Thunderstorm and rain conditions are "
                        "simulated during the evening."
                    ),

                    "recommended_action": (
                        "Avoid exposed outdoor activities if "
                        "thunder or lightning develops."
                    ),
                },
            ],


            # ==========================================
            # VADODARA
            # ==========================================

            "vadodara": [
                {
                    "id": "VAD-RAIN-001",

                    "type": "heavy_rain",

                    "title": "Heavy Rain Watch",

                    "severity": "YELLOW",

                    "start_hour": 17,

                    "end_hour": 21,

                    "message": (
                        "Periods of heavier rain are simulated "
                        "during the evening."
                    ),

                    "recommended_action": (
                        "Allow extra travel time and reconsider "
                        "weather-sensitive outdoor activities."
                    ),
                }
            ],


            # ==========================================
            # MUMBAI
            # ==========================================

            "mumbai": [
                {
                    "id": "MUM-RAIN-001",

                    "type": "heavy_rain",

                    "title": "Heavy Rain Alert",

                    "severity": "ORANGE",

                    "start_hour": 14,

                    "end_hour": 21,

                    "message": (
                        "Heavy rainfall conditions are simulated "
                        "for the afternoon and evening."
                    ),

                    "recommended_action": (
                        "Avoid unnecessary outdoor travel during "
                        "intense rain and allow extra commute time."
                    ),
                },

                {
                    "id": "MUM-WIND-001",

                    "type": "strong_wind",

                    "title": "Strong Wind Watch",

                    "severity": "YELLOW",

                    "start_hour": 15,

                    "end_hour": 19,

                    "message": (
                        "Strong coastal winds are simulated "
                        "during the late afternoon."
                    ),

                    "recommended_action": (
                        "Use caution for cycling, beach visits, "
                        "and exposed outdoor events."
                    ),
                },
            ],


            # ==========================================
            # DELHI
            # ==========================================

            "delhi": [
                {
                    "id": "DEL-HEAT-001",

                    "type": "heat",

                    "title": "Heat Alert",

                    "severity": "ORANGE",

                    "start_hour": 11,

                    "end_hour": 17,

                    "message": (
                        "Very hot afternoon conditions are "
                        "simulated."
                    ),

                    "recommended_action": (
                        "Reduce strenuous outdoor activity and "
                        "prefer morning or evening hours."
                    ),
                },

                {
                    "id": "DEL-AQI-001",

                    "type": "poor_air_quality",

                    "title": "Poor Air Quality Advisory",

                    "severity": "YELLOW",

                    "start_hour": 0,

                    "end_hour": 23,

                    "message": (
                        "Elevated air pollution is simulated "
                        "throughout the day."
                    ),

                    "recommended_action": (
                        "Consider reducing prolonged or strenuous "
                        "outdoor activity."
                    ),
                },
            ],


            # ==========================================
            # BENGALURU
            # ==========================================

            "bengaluru": [
                {
                    "id": "BLR-STORM-001",

                    "type": "thunderstorm",

                    "title": "Evening Thunderstorm Watch",

                    "severity": "YELLOW",

                    "start_hour": 16,

                    "end_hour": 20,

                    "message": (
                        "Scattered thunderstorm conditions are "
                        "simulated during the evening."
                    ),

                    "recommended_action": (
                        "Keep flexible plans for outdoor "
                        "activities during the warning period."
                    ),
                }
            ],
        }

        return warnings.get(key, [])