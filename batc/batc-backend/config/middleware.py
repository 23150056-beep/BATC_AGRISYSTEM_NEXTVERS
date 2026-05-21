"""
Security middleware to set cache headers preventing unauthorized caching of authenticated pages.
This prevents the security issue where browser cache serves an authenticated page
without re-validating the token with the server.

Reference: Security Fix for back/forward cache issue with authentication
"""


class NoCacheAuthMiddleware:
    """
    Middleware to set cache-control headers on authenticated API responses.
    
    This prevents the browser from caching authenticated responses, which could
    allow an attacker to navigate back/forward to see cached authenticated pages
    without re-validating the token.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Check if this is an authenticated request or an auth endpoint
        is_auth_endpoint = (
            request.path.startswith("/api/v1/auth/")
            or request.path.startswith("/api/")
            and request.user.is_authenticated
        )

        # Set cache headers for auth endpoints and authenticated API calls
        if is_auth_endpoint or (
            request.path.startswith("/api/")
            and request.META.get("HTTP_AUTHORIZATION", "").startswith("Bearer")
        ):
            # Prevent all caching for authenticated responses
            response["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
            response["Pragma"] = "no-cache"
            response["Expires"] = "0"

        return response
