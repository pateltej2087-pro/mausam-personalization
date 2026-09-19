from abc import ABC, abstractmethod

from schemas import CurrentWeatherResponse


class WeatherProvider(ABC):
    """
    Every weather data source (demo generator today, real IMD integration
    later) must implement this interface. Routes depend on THIS, never on
    a specific provider directly — that's what lets us swap Demo <-> IMD
    without touching the rest of the app.
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Short label identifying this source, e.g. 'DEMO' or 'IMD'."""
        raise NotImplementedError

    @abstractmethod
    def get_current_weather(self, location: str) -> CurrentWeatherResponse:
        raise NotImplementedError