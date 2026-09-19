from fastapi import APIRouter

from activity_types import PROFILE_TYPES


router = APIRouter(
    prefix="/profiles",
    tags=["profiles"],
)


@router.get("")
def list_profiles():

    return [
        {
            "key": key,
            "label": cfg["label"],
            "icon": cfg["icon"],
            "suggested_activities":
                cfg["suggested_activities"],
            "factor_multipliers":
                cfg["factor_multipliers"],
        }

        for key, cfg
        in PROFILE_TYPES.items()
    ]