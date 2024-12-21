from datetime import datetime, timezone, timedelta
from typing import Any
from pydantic import BaseModel, Field
from src.agent.workflows.forecast_by_png.state import State
from src.agent.common import default_model, bedrock_runtime
from src.agent.prompt.common import payment_statement_table
from langchain_aws import ChatBedrock

from langchain_core.prompts import ChatPromptTemplate

JST = timezone(timedelta(hours=9))


class Duration(BaseModel):
    since: str = Field(default="", description="取得開始日時（例: 2024-12-11 00:00）")
    until: str = Field(default="", description="取得終了日時（例: 2024-12-11 23:59）")


def get_sensor_duration_node(_state: State) -> dict[str, Any]:
    now_jst = datetime.now(JST)
    year = now_jst.year
    month = now_jst.month

    prompt = ChatPromptTemplate.from_template(
        f"""
{year}年{month}月の電気料金の予測に必要な家庭内環境データを取得してください。

明細は過去の実績を参考に出力してください

{payment_statement_table}
""".strip()
    )

    llm = ChatBedrock(
        model=default_model,
        client=bedrock_runtime,
    )

    chain = prompt | llm.with_structured_output(Duration)
    result: Duration = chain.invoke({})

    return {
        "sensor_duration_since": result.since,
        "sensor_duration_until": result.until,
    }
