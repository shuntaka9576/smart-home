from src.domain.analytics_smart_home_data import analysis_smart_home_data
from tests.utils import homeConditions
import subprocess


def test_analysis_smart_home_data():
    output_file_path = analysis_smart_home_data(homeConditions)

    subprocess.run(["open", output_file_path])
