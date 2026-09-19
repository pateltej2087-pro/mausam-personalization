from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String

from database import Base


class WeatherRequestLog(Base):
    """
    Stores weather conditions whenever the user checks a location.

    This history allows the What Changed? Engine to compare the
    current weather with the user's actual previous check.
    """

    __tablename__ = "weather_request_logs"

    id = Column(Integer, primary_key=True, index=True)

    location = Column(String, nullable=False, index=True)

    temperature_c = Column(Float, nullable=False)

    feels_like_c = Column(Float, nullable=True)

    humidity_percent = Column(Integer, nullable=True)

    rain_probability_percent = Column(Integer, nullable=True)

    wind_speed_kmph = Column(Float, nullable=True)

    visibility_km = Column(Float, nullable=True)

    aqi = Column(Integer, nullable=True)

    condition = Column(String, nullable=False)

    source = Column(String, nullable=False)

    requested_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )