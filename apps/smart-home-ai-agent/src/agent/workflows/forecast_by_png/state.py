import operator
from typing import Annotated, Any
from pydantic import BaseModel, Field


class State(BaseModel):
    mcp_session: Any | None = Field(
        description="MCPのセッション",
        default=None,
    )
    sensor_duration_since: str | None = Field(
        description="期間指定(開始)",
        default=None,
    )
    sensor_duration_until: str | None = Field(
        description="期間指定(終了)",
        default=None,
    )
    gen_graph_png_path: str | None = Field(
        description="センサーデータのグラフ",
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
