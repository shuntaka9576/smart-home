import base64
from typing import Any
import traceback

from langchain_core.messages import HumanMessage
from src.agent.workflows.forecast_by_png.state import State
from src.agent.common import default_model, bedrock_runtime
from langchain_aws import ChatBedrock
from src.agent.prompt.common import (
    get_forecast_electric_energy_template,
)


def load_image(image_path: str) -> str:
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


async def forecast_electric_energy_by_png_node(state: State) -> dict[str, Any]:
    try:
        if state.gen_graph_png_path is None:
            raise Exception("mcp_session is not set")

        base64_image = load_image(state.gen_graph_png_path)

        llm = ChatBedrock(
            model=default_model,
            client=bedrock_runtime,
        )

        prompt = get_forecast_electric_energy_template()
        prompt += """主に添付した画像を元にしてください"""

        messages: list[Any] = [
            HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{base64_image}"},
                    },
                ]
            )
        ]

        response = await llm.ainvoke(messages)

        return {"forecast_result": response.content}

    except Exception as e:
        print(f"error: {traceback.format_exc()}")
        raise e
