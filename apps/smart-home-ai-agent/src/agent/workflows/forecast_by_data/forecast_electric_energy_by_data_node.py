from typing import Any
import traceback
from src.agent.workflows.forecast_by_data.state import State
from src.agent.common import default_model, bedrock_runtime
from langgraph.prebuilt import create_react_agent
from langchain_aws import ChatBedrock
from src.agent.prompt.common import (
    get_forecast_electric_energy_template,
)


async def forecast_electric_energy_by_data_node(state: State) -> dict[str, Any]:
    try:
        if state.mcp_session is None:
            raise Exception("mcp_session is not set")

        tools = state.mcp_session.get_tools()

        llm = ChatBedrock(
            model=default_model,
            client=bedrock_runtime,
        )

        react_agent = create_react_agent(model=llm, tools=tools)

        result = await react_agent.ainvoke(
            {"messages": [("human", get_forecast_electric_energy_template())]}
        )

        return {"forecast_result": result["messages"][-1].content}

    except Exception as e:
        print(f"error: {traceback.format_exc()}")
        raise e
