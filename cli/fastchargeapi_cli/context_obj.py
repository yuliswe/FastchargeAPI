from dataclasses import dataclass
from typing import Optional


@dataclass
class ContextObject:
    profile: Optional[str]
