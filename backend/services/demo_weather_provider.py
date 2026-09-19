import math
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from schemas import CurrentWeatherResponse, HourlyForecastItem
from services.weather_provider import WeatherProvider


class LocationNotSupportedError(Exception):
    pass


# ==========================================
# CITY DEMO PROFILES
# ==========================================

CITY_PROFILES = {
    "ahmedabad": {
        "display_name": "Ahmedabad",
        "lat": 23.0225,
        "lon": 72.5714,
        "base_temp_c": 33,
        "base_humidity": 42,
        "rain_tendency": 0.35,
        "base_aqi": 145,
        "sunrise": "06:24 AM",
        "sunset": "06:42 PM",
    },

    "vadodara": {
        "display_name": "Vadodara",
        "lat": 22.3072,
        "lon": 73.1812,
        "base_temp_c": 32,
        "base_humidity": 48,
        "rain_tendency": 0.40,
        "base_aqi": 120,
        "sunrise": "06:22 AM",
        "sunset": "06:40 PM",
    },

    "mumbai": {
        "display_name": "Mumbai",
        "lat": 19.0760,
        "lon": 72.8777,
        "base_temp_c": 30,
        "base_humidity": 75,
        "rain_tendency": 0.55,
        "base_aqi": 95,
        "sunrise": "06:30 AM",
        "sunset": "06:48 PM",
    },

    "delhi": {
        "display_name": "Delhi",
        "lat": 28.6139,
        "lon": 77.2090,
        "base_temp_c": 34,
        "base_humidity": 38,
        "rain_tendency": 0.25,
        "base_aqi": 210,
        "sunrise": "06:12 AM",
        "sunset": "06:34 PM",
    },

    "bengaluru": {
        "display_name": "Bengaluru",
        "lat": 12.9716,
        "lon": 77.5946,
        "base_temp_c": 26,
        "base_humidity": 55,
        "rain_tendency": 0.45,
        "base_aqi": 85,
        "sunrise": "06:08 AM",
        "sunset": "06:26 PM",
    },
}


class DemoWeatherProvider(WeatherProvider):
    """
    Generates realistic, internally-consistent DEMO/SIMULATED
    weather data.

    Current conditions are selected using India's local time,
    while observation timestamps remain UTC.

    This is NOT live weather and must never be presented as
    live IMD data.
    """

    # ==========================================
    # SOURCE
    # ==========================================

    @property
    def source_name(self) -> str:
        return "DEMO"


    # ==========================================
    # CURRENT WEATHER
    # ==========================================

    def get_current_weather(
        self,
        location: str,
    ) -> CurrentWeatherResponse:

        key = location.strip().lower()


        # --------------------------------------
        # VALIDATE LOCATION
        # --------------------------------------

        if key not in CITY_PROFILES:

            supported = ", ".join(
                profile["display_name"]
                for profile in CITY_PROFILES.values()
            )

            raise LocationNotSupportedError(
                f"'{location}' is not a supported "
                f"demo location. Supported: {supported}"
            )


        profile = CITY_PROFILES[key]


        # ======================================
        # TIME HANDLING
        # ======================================

        # Keep UTC for timestamps/database.
        now_utc = datetime.now(timezone.utc)

        # Use Indian local time when selecting
        # the current simulated weather hour.
        now_local = now_utc.astimezone(
            ZoneInfo("Asia/Kolkata")
        )


        # ======================================
        # BUILD 24-HOUR FORECAST
        # ======================================

        hourly_forecast = [
            self._build_hour(
                profile,
                hour,
            )
            for hour in range(24)
        ]


        # IMPORTANT:
        # Use local Indian hour, not UTC hour.
        current = hourly_forecast[
            now_local.hour
        ]


        # ======================================
        # DERIVED CURRENT VALUES
        # ======================================

        feels_like = self._feels_like(
            current.temperature_c,
            current.humidity_percent,
            current.wind_speed_kmph,
        )


        rainfall_mm = round(
            (
                current.rain_probability_percent
                / 100
            )
            ** 2
            * 12,
            1,
        )


        # ======================================
        # RESPONSE
        # ======================================

        return CurrentWeatherResponse(

            location=
                profile["display_name"],

            latitude=
                profile["lat"],

            longitude=
                profile["lon"],

            # Keep timestamp UTC.
            # Frontend converts it for display.
            observation_time=
                now_utc.isoformat(),

            temperature_c=
                current.temperature_c,

            feels_like_c=
                round(feels_like, 1),

            humidity_percent=
                current.humidity_percent,

            rainfall_mm=
                rainfall_mm,

            rain_probability_percent=
                current.rain_probability_percent,

            wind_speed_kmph=
                current.wind_speed_kmph,

            visibility_km=
                current.visibility_km,

            aqi=
                current.aqi,

            condition=
                current.condition,

            hourly_forecast=
                hourly_forecast,

            sunrise=
                profile.get("sunrise", "06:00 AM"),

            sunset=
                profile.get("sunset", "06:30 PM"),

            source=
                self.source_name,

            is_demo_data=
                True,
        )


    # ==========================================
    # BUILD ONE FORECAST HOUR
    # ==========================================

    def _build_hour(
        self,
        profile: dict,
        hour: int,
    ) -> HourlyForecastItem:

        # --------------------------------------
        # TEMPERATURE
        # --------------------------------------
        #
        # Coolest around early morning.
        # Warmest around afternoon.
        #

        if 5 <= hour <= 19:

            diurnal = math.sin(
                math.pi
                * (hour - 5)
                / 14
            )

        else:

            diurnal = -0.4


        temp = (
            profile["base_temp_c"]
            + diurnal * 5
        )


        # --------------------------------------
        # RAIN
        # --------------------------------------

        afternoon_bias = max(
            0,
            math.sin(
                math.pi
                * (hour - 12)
                / 12
            ),
        )


        rain_probability = int(

            self._clamp(

                profile["rain_tendency"]
                * 100
                * (
                    0.3
                    + afternoon_bias
                ),

                2,
                95,
            )
        )


        # --------------------------------------
        # HUMIDITY
        # --------------------------------------

        humidity = self._clamp(

            profile["base_humidity"]
            + (1 - diurnal) * 6,

            15,
            95,
        )


        # --------------------------------------
        # WIND
        # --------------------------------------

        wind_speed = self._clamp(

            6
            + afternoon_bias * 14,

            2,
            45,
        )


        # --------------------------------------
        # AQI
        # --------------------------------------

        aqi = int(

            self._clamp(

                profile["base_aqi"]
                - diurnal * 20,

                15,
                400,
            )
        )


        # --------------------------------------
        # VISIBILITY
        # --------------------------------------

        visibility = self._clamp(

            10
            - (
                rain_probability
                / 100
            )
            * 7,

            0.5,
            10,
        )


        # ======================================
        # CONDITION
        # ======================================

        if rain_probability >= 65:

            condition = (
                "Thunderstorms Likely"
            )

        elif rain_probability >= 40:

            condition = (
                "Rain Likely"
            )

        elif rain_probability >= 20:

            condition = (
                "Partly Cloudy"
            )

        elif temp >= 37:

            condition = (
                "Hot and Clear"
            )

        else:

            condition = (
                "Clear Sky"
            )


        # ======================================
        # HOURLY RESPONSE
        # ======================================

        return HourlyForecastItem(

            hour=
                f"{hour:02d}:00",

            temperature_c=
                round(temp, 1),

            rain_probability_percent=
                rain_probability,

            condition=
                condition,

            humidity_percent=
                int(round(humidity)),

            wind_speed_kmph=
                round(wind_speed, 1),

            aqi=
                aqi,

            visibility_km=
                round(visibility, 1),
        )


    # ==========================================
    # FEELS LIKE
    # ==========================================

    @staticmethod
    def _feels_like(
        temp_c: float,
        humidity: float,
        wind_kmph: float,
    ) -> float:

        if temp_c >= 27:

            return (
                temp_c
                + (humidity - 40)
                * 0.05
            )

        return (
            temp_c
            - wind_kmph * 0.03
        )


    # ==========================================
    # CLAMP
    # ==========================================

    @staticmethod
    def _clamp(
        value: float,
        low: float,
        high: float,
    ) -> float:

        return max(
            low,
            min(
                high,
                value,
            ),
        )