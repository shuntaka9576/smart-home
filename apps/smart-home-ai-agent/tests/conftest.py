import os
import sys
from dotenv import load_dotenv

sys.path.append(
    os.path.abspath(os.path.dirname(os.path.abspath(__file__)) + "/../src/")
)

dotenv_path = ".env"


def pytest_sessionstart():
    load_dotenv(dotenv_path)

    # NOTE: テストの環境変数を設定する
    # os.environ["SMART_HOME_API_GATEWAY_DOMAIN"] = "test_domain"
