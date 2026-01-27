from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class GlobalAnonRateThrottle(AnonRateThrottle):
    """
    Global per-IP throttle applied to all anonymous requests.
    Uses the "global_anon" scope defined in settings.REST_FRAMEWORK.
    """

    scope = "global_anon"


class GlobalUserRateThrottle(UserRateThrottle):
    """
    Global per-user throttle applied to all authenticated requests.
    Uses the "global_user" scope defined in settings.REST_FRAMEWORK.
    """

    scope = "global_user"

