class AlreadyExists(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class NotFound(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


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
