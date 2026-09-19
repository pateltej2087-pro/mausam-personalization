from typing import List, Optional

from pydantic import BaseModel, Field


class HourlyForecastItem(BaseModel):
    hour: str = Field(..., description="24h clock time, e.g. '14:00'")
    temperature_c: float
    rain_probability_percent: int
    condition: str
    humidity_percent: int
    wind_speed_kmph: float
    aqi: int
    visibility_km: float


class CurrentWeatherResponse(BaseModel):
    location: str
    latitude: float
    longitude: float
    observation_time: str

    temperature_c: float
    feels_like_c: float
    humidity_percent: int
    rainfall_mm: float
    rain_probability_percent: int
    wind_speed_kmph: float
    visibility_km: float
    aqi: int
    condition: str

    hourly_forecast: List[HourlyForecastItem]

    sunrise: Optional[str] = Field(None, description="Sunrise time formatted in AM/PM, e.g. '06:24 AM'")
    sunset: Optional[str] = Field(None, description="Sunset time formatted in AM/PM, e.g. '06:42 PM'")

    source: str
    is_demo_data: bool