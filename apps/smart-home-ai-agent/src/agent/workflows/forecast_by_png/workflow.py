from langgraph.graph import StateGraph, END
from typing import Any, Callable, Iterator
from src.agent.workflows.forecast_by_png.forecast_electric_energy_by_png_node import (
    forecast_electric_energy_by_png_node,
)
from src.agent.workflows.common.adjutmet_message_for_slack_node import (
    adjutmet_message_for_slack_node,
)
from src.agent.workflows.forecast_by_png.gen_sensor_data_graph_node import (
    gen_sensor_data_graph_node,
)
from src.agent.workflows.forecast_by_png.get_sensor_duration_node import (
    get_sensor_duration_node,
)
from src.agent.workflows.forecast_by_png.state import State


class Node:
    def __init__(self, name: str, node: Callable[[State], Any]):
        self.name = name
        self.node = node


class Nodes:
    def __init__(self):
        self.get_sensor_duration_node: Node = Node(
            "get_sensor_duration_node", get_sensor_duration_node
        )
        self.gen_sensor_data_graph_node: Node = Node(
            "gen_sensor_data_graph_node", gen_sensor_data_graph_node
        )
        self.forecast_electric_energy_by_png_node = Node(
            "forecast_electric_energy_by_png_node", forecast_electric_energy_by_png_node
        )
        self.adjutmet_message_for_slack_node: Node = Node(
            "adjutmet_message_for_slack_node", adjutmet_message_for_slack_node
        )

    def __iter__(self) -> Iterator[Node]:
        return iter(
            [
                self.get_sensor_duration_node,
                self.gen_sensor_data_graph_node,
                self.forecast_electric_energy_by_png_node,
                self.adjutmet_message_for_slack_node,
            ]
        )


def create_forecast_electric_energy_by_png_workflow():
    workflow = StateGraph(State)
    nodes = Nodes()

    for node in nodes:
        workflow.add_node(node.name, node.node)

    workflow.set_entry_point(nodes.get_sensor_duration_node.name)
    workflow.add_edge(
        nodes.get_sensor_duration_node.name, nodes.gen_sensor_data_graph_node.name
    )
    workflow.add_edge(
        nodes.gen_sensor_data_graph_node.name,
        nodes.forecast_electric_energy_by_png_node.name,
    )
    workflow.add_edge(
        nodes.forecast_electric_energy_by_png_node.name,
        nodes.adjutmet_message_for_slack_node.name,
    )
    workflow.add_edge(nodes.adjutmet_message_for_slack_node.name, END)

    return workflow
