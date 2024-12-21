from src.infra.slack_client import post_text_to_slack_via_webhook, upload_file_to_slack
from src.agent.workflows.forecast_by_data.workflow import (
    create_forecast_electric_energy_by_data_workflow,
)
from src.agent.workflows.forecast_by_png.workflow import (
    create_forecast_electric_energy_by_png_workflow,
)


async def run(mcp_session):
    forecast_by_data = await (
        create_forecast_electric_energy_by_data_workflow().compile()
    ).ainvoke({"mcp_session": mcp_session})
    post_text_to_slack_via_webhook(forecast_by_data["slack_report"])

    forecast_by_png = await (
        create_forecast_electric_energy_by_png_workflow().compile()
    ).ainvoke(
        {"mcp_session": mcp_session},
    )
    post_text_to_slack_via_webhook(forecast_by_png["slack_report"])
    upload_file_to_slack(forecast_by_png["gen_graph_png_path"])
