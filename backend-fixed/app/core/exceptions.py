"""
Jewellery CRM — Custom Exceptions
====================================
Application-specific exception classes for consistent error handling.
"""

from typing import Any, Optional


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        status_code: int = 500,
        detail: str = "An unexpected error occurred",
        headers: Optional[dict[str, str]] = None,
    ) -> None:
        self.status_code = status_code
        self.detail = detail
        self.headers = headers
        super().__init__(detail)


class AuthenticationError(AppException):
    """Raised when authentication fails."""

    def __init__(self, detail: str = "Could not validate credentials") -> None:
        super().__init__(status_code=401, detail=detail)


class AuthorizationError(AppException):
    """Raised when a user lacks required permissions."""

    def __init__(self, detail: str = "Insufficient permissions") -> None:
        super().__init__(status_code=403, detail=detail)


class NotFoundError(AppException):
    """Raised when a requested resource is not found."""

    def __init__(self, resource: str = "Resource", identifier: Any = None) -> None:
        detail = f"{resource} not found"
        if identifier:
            detail = f"{resource} with ID '{identifier}' not found"
        super().__init__(status_code=404, detail=detail)


class ConflictError(AppException):
    """Raised when a resource already exists or conflicts with current state."""

    def __init__(self, detail: str = "Resource already exists") -> None:
        super().__init__(status_code=409, detail=detail)


class ValidationError(AppException):
    """Raised when request validation fails beyond Pydantic checks."""

    def __init__(self, detail: str = "Validation error") -> None:
        super().__init__(status_code=422, detail=detail)


class RateLimitError(AppException):
    """Raised when rate limit is exceeded."""

    def __init__(self, detail: str = "Too many requests. Please try again later.") -> None:
        super().__init__(
            status_code=429,
            detail=detail,
            headers={"Retry-After": "60"},
        )
