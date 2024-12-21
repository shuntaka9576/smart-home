from typing import Any

from src.agent.workflows.forecast_by_png.state import State
from src.domain.analytics_smart_home_data import analysis_smart_home_data
from src.infra.smart_home_api_client import get_smart_home_data


def gen_sensor_data_graph_node(state: State) -> dict[str, Any]:
    if state.sensor_duration_since is None or state.sensor_duration_until is None:
        raise Exception("sensor_duration_since or sensor_duration_until is not set")

    homeConditions = get_smart_home_data(
        state.sensor_duration_since, state.sensor_duration_until
    )

    gen_graph_png_path = analysis_smart_home_data(homeConditions)

    return {"gen_graph_png_path": gen_graph_png_path}
