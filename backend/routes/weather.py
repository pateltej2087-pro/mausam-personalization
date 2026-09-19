from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import WeatherRequestLog
from schemas import CurrentWeatherResponse
from services.demo_weather_provider import (
    CITY_PROFILES,
    DemoWeatherProvider,
    LocationNotSupportedError,
)

router = APIRouter(prefix="/weather", tags=["weather"])

weather_provider = DemoWeatherProvider()


@router.get("/current", response_model=CurrentWeatherResponse)
def get_current_weather(
    location: str = Query(
        ...,
        description="City name, e.g. Ahmedabad",
    ),
    db: Session = Depends(get_db),
):
    """
    Return current weather and store the complete weather snapshot
    so the What Changed? Engine can compare future checks against it.
    """

    try:
        weather = weather_provider.get_current_weather(location)

    except LocationNotSupportedError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    # Save complete snapshot
    weather_log = WeatherRequestLog(
        location=weather.location,
        temperature_c=weather.temperature_c,
        feels_like_c=weather.feels_like_c,
        humidity_percent=weather.humidity_percent,
        rain_probability_percent=weather.rain_probability_percent,
        wind_speed_kmph=weather.wind_speed_kmph,
        visibility_km=weather.visibility_km,
        aqi=weather.aqi,
        condition=weather.condition,
        source=weather.source,
    )

    db.add(weather_log)
    db.commit()

    return weather


@router.get("/locations")
def get_supported_locations():
    return [
        profile["display_name"]
        for profile in CITY_PROFILES.values()
    ]