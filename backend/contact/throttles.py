from rest_framework.throttling import AnonRateThrottle

class ContactAnonRateThrottle(AnonRateThrottle):
    scope = "contact"
