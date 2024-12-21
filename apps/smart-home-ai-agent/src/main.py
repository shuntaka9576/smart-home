from fastapi import FastAPI
from contextlib import asynccontextmanager
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from src.application.use_case.create_electric_energy_report_use_case import run
from src.config import config
from src.agent.mcp import MCPToolkit


server_params = StdioServerParameters(
    command=config.MCP_BIN_PATH,
    env={"SMART_HOME_API_KEY": config.SMART_HOME_API_KEY},
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            mcp_session = MCPToolkit(session=session)
            await mcp_session.initialize()

            await session.initialize()
            app.state.mcp_session = mcp_session

            yield


app = FastAPI(lifespan=lifespan)


@app.post("/electric-energy-report")
async def post_electric_energy_report():
    await run(app.state.mcp_session)

    return {"code": "success"}
