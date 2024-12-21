from src.infra.slack_client import post_text_to_slack_via_webhook, upload_file_to_slack

test = "/var/folders/j2/fww6wk7x28932gt_scqkk5ph0000gp/T/tmp8n_omw5d.png"


def test_post_text_to_slack_via_webhook():
    message = "[Pytest] Webhook test message"
    resp = post_text_to_slack_via_webhook(message)

    assert resp is not None, "Slack webhook response should not be None."
    assert resp.status_code == 200, f"Unexpected status code: {resp.status_code}"


def test_upload_file_to_slack():
    test_image_path = "/var/folders/j2/fww6wk7x28932gt_scqkk5ph0000gp/T/tmp8n_omw5d.png"
    resp = upload_file_to_slack(test_image_path, "[Pytest] file upload test")

    assert resp is not None, "Slack file upload response should not be None."

    assert resp["ok"] is True, f"Slack API returned error: {resp}"
    assert "file" in resp, "Response JSON should have 'file' key."
