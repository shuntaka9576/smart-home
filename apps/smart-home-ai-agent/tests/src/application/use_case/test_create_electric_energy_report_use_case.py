import pytest
from src.application.use_case.create_electric_energy_report_use_case import run
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from src.agent.mcp import MCPToolkit
import os


@pytest.mark.asyncio
async def test_run():
    server_params = StdioServerParameters(
        command=os.getenv("MCP_BIN_PATH", ""),
        env={"SMART_HOME_API_KEY": os.getenv("SMART_HOME_API_KEY", "")},
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            mcp_session = MCPToolkit(session=session)
            await mcp_session.initialize()
            response = await run(mcp_session)

            print(response)
