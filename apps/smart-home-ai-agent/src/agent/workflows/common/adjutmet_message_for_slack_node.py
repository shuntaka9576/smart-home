from typing import Any, Union
import traceback

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from src.agent.workflows.forecast_by_data.state import State
from src.agent.common import default_model, bedrock_runtime
from langchain_aws import ChatBedrock


def adjutmet_message_for_slack_node(state) -> dict[str, Any]:
    try:
        llm = ChatBedrock(
            model=default_model,
            client=bedrock_runtime,
        )

        prompt = ChatPromptTemplate.from_template(
            f"""以下の内容をSlackメッセージとしてみやすいように変換して、変換した文章だけ返却してください。
また以下注意してください

* バックスペース3つで文章全体を囲まないでください。装飾表現がSlackで適用されません。
---
{state.forecast_result}"""
        )

        chain = prompt | llm | StrOutputParser()
        slack_report = chain.invoke({})

        return {"slack_report": slack_report}
    except Exception as e:
        print(f"error: {traceback.format_exc()}")
        raise e
