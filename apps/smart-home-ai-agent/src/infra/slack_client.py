import logging
import requests
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from src.config import config

client = WebClient(token=config.SLACK_API_TOKEN)


def post_text_to_slack_via_webhook(message: str):
    try:
        response = client.chat_postMessage(channel="#energy-report", text=message)

        return response
    except requests.exceptions.RequestException as e:
        logging.error(f"Error sending message to Slack webhook: {e}")
        return None


def upload_file_to_slack(file_path: str, initial_comment: str = ""):
    try:
        response = client.files_upload_v2(
            channel=config.SLACK_CHANNEL_ID,
            file=file_path,
            initial_comment=initial_comment,
        )
        return response
    except SlackApiError as e:
        logging.error(f"Error uploading file to Slack: {e.response['error']}")
        return None
