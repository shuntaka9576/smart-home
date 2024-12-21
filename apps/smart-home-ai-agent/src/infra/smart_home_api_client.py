import requests
from src.config import config
from typing import List, Dict, Any


class HomeCondition:
    def __init__(
        self,
        id: str,
        cumulative_electric_energy: float,
        measured_instantaneous: int,
        temperature: float,
        humidity: int,
        illuminance: int,
        ac_status: bool,
        created_at: str,
        updated_at: str,
        electric_energy_delta: float,
    ):
        self.id = id
        self.cumulative_electric_energy = cumulative_electric_energy
        self.measured_instantaneous = measured_instantaneous
        self.temperature = temperature
        self.humidity = humidity
        self.illuminance = illuminance
        self.ac_status = ac_status
        self.created_at = created_at
        self.updated_at = updated_at
        self.electric_energy_delta = electric_energy_delta

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "cumulativeElectricEnergy": self.cumulative_electric_energy,
            "measuredInstantaneous": self.measured_instantaneous,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "illuminance": self.illuminance,
            "acStatus": self.ac_status,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            "electricEnergyDelta": self.electric_energy_delta,
        }


def get_smart_home_data(since: str, until: str) -> List[HomeCondition]:
    url = f"{config.SMART_HOME_API_GATEWAY_DOMAIN}/home-condition?since={since}&until={until}"
    headers = {"Accept": "application/json", "x-api-key": config.SMART_HOME_API_KEY}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

        home_conditions = [
            HomeCondition(
                id=entry["id"],
                cumulative_electric_energy=entry["cumulativeElectricEnergy"],
                measured_instantaneous=entry["measuredInstantaneous"],
                temperature=entry["temperature"],
                humidity=entry["humidity"],
                illuminance=entry["illuminance"],
                ac_status=entry["acStatus"],
                created_at=entry["createdAt"],
                updated_at=entry["updatedAt"],
                electric_energy_delta=entry["electricEnergyDelta"],
            )
            for entry in data.get("homeConditions", [])
        ]
        return home_conditions
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return []
