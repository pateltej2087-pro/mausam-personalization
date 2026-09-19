from datetime import timedelta

from sqlalchemy.orm import Session

from models import WeatherRequestLog


# Requests made very close together are usually part of
# the same page load / refresh, not a real previous check.
MIN_CHECK_GAP_MINUTES = 2


def get_latest_weather_check(
    db: Session,
    location: str,
):
    """
    Return the newest stored weather snapshot
    for the selected location.
    """

    return (
        db.query(WeatherRequestLog)
        .filter(
            WeatherRequestLog.location == location
        )
        .order_by(
            WeatherRequestLog.requested_at.desc(),
            WeatherRequestLog.id.desc(),
        )
        .first()
    )


def get_previous_weather_check(
    db: Session,
    location: str,
):
    """
    Return the most recent meaningful weather check
    before the latest check.

    Very recent duplicate requests are ignored because
    they usually belong to the same page load.
    """

    latest = get_latest_weather_check(
        db,
        location,
    )

    if latest is None:
        return None


    cutoff_time = (
        latest.requested_at
        - timedelta(
            minutes=MIN_CHECK_GAP_MINUTES
        )
    )


    previous = (
        db.query(WeatherRequestLog)
        .filter(
            WeatherRequestLog.location == location,
            WeatherRequestLog.requested_at
            <= cutoff_time,
        )
        .order_by(
            WeatherRequestLog.requested_at.desc(),
            WeatherRequestLog.id.desc(),
        )
        .first()
    )


    return previous