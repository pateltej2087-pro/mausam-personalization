from abc import ABC, abstractmethod


class WarningProvider(ABC):
    """
    Base interface for weather-warning providers.

    Phase 3 currently uses DemoWarningProvider.

    Later, an official warning source can implement
    this interface without changing the personalization
    and warning-matching logic.
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        pass


    @abstractmethod
    def get_warnings(self, location: str):
        """
        Return active/relevant warnings for a location.
        """
        pass