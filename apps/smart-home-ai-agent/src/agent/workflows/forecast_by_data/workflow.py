from langgraph.graph import StateGraph, END
from typing import Any, Callable, Iterator
from src.agent.workflows.common.adjutmet_message_for_slack_node import (
    adjutmet_message_for_slack_node,
)
from src.agent.workflows.forecast_by_data.forecast_electric_energy_by_data_node import (
    forecast_electric_energy_by_data_node,
)
from src.agent.workflows.forecast_by_data.state import State


class Node:
    def __init__(self, name: str, node: Callable[[State], Any]):
        self.name = name
        self.node = node


class Nodes:
    def __init__(self):
        self.forecast_electric_energy_by_data_node: Node = Node(
            "forecast_electric_energy_by_data_node",
            forecast_electric_energy_by_data_node,
        )
        self.adjutmet_message_for_slack_node: Node = Node(
            "adjutmet_message_for_slack_node", adjutmet_message_for_slack_node
        )

    def __iter__(self) -> Iterator[Node]:
        return iter(
            [
                self.forecast_electric_energy_by_data_node,
                self.adjutmet_message_for_slack_node,
            ]
        )


def create_forecast_electric_energy_by_data_workflow():
    workflow = StateGraph(State)
    nodes = Nodes()

    for node in nodes:
        workflow.add_node(node.name, node.node)

    workflow.set_entry_point(nodes.forecast_electric_energy_by_data_node.name)
    workflow.add_edge(
        nodes.forecast_electric_energy_by_data_node.name,
        nodes.adjutmet_message_for_slack_node.name,
    )
    workflow.add_edge(nodes.adjutmet_message_for_slack_node.name, END)

    return workflow
