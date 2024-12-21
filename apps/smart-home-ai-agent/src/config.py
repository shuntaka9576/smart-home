import os
import certifi
from pydantic_settings import BaseSettings

os.environ["SSL_CERT_FILE"] = certifi.where()


class Config(BaseSettings):
    SMART_HOME_API_KEY: str
    SMART_HOME_API_GATEWAY_DOMAIN: str
    MCP_BIN_PATH: str
    BEDROCK_AWS_REGION: str
    SLACK_WEBHOOK_URL: str
    SLACK_API_TOKEN: str
    SLACK_CHANNEL_ID: str


def get_required_env(key: str) -> str:
    value = os.getenv(key)
    if value is None:
        raise ValueError(f"{key} environment variable is required.")
    return value


def load_env_config() -> Config:
    config = Config(
        SMART_HOME_API_KEY=get_required_env("SMART_HOME_API_KEY"),
        SMART_HOME_API_GATEWAY_DOMAIN=get_required_env("SMART_HOME_API_GATEWAY_DOMAIN"),
        MCP_BIN_PATH=get_required_env("MCP_BIN_PATH"),
        BEDROCK_AWS_REGION="us-east-1",
        SLACK_WEBHOOK_URL=get_required_env("SLACK_WEBHOOK_URL"),
        SLACK_API_TOKEN=get_required_env("SLACK_API_TOKEN"),
        SLACK_CHANNEL_ID=get_required_env("SLACK_CHANNEL_ID"),
    )
    return config


config = load_env_config()
