import boto3
from src.config import config

default_model = "anthropic.claude-3-5-sonnet-20240620-v1:0"
bedrock_runtime = boto3.client("bedrock-runtime", region_name=config.BEDROCK_AWS_REGION)
