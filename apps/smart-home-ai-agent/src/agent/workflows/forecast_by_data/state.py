from typing import Any
from pydantic import BaseModel, Field


class State(BaseModel):
    mcp_session: Any | None = Field(
        description="MCPのセッション",
        default=None,
    )
    forecast_result: str | None = Field(
        description="予測結果",
        default=None,
    )
    slack_report: str | None = Field(
        description="レポート結果",
        default=None,
    )
