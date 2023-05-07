from typing import Optional


class AlreadyExists(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class NotFound(Exception):
    def __init__(self, message: str, resource: str, query: dict) -> None:
        super().__init__(message)
        self.message = message
        self.resource = resource
        self.query = query


class TooManyResources(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class PermissionDenied(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ImmutableResource(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class BadUserInput(Exception):
    def __init__(self, message: str, detail_code: Optional[str] = None) -> None:
        super().__init__(message)
        self.message = message
        self.detail_code = detail_code
