ARG MCP_SERVER_BIN_NAME="smart-home-mcp-server"

# MCPサーバーのビルドステップ
FROM golang:1.22.0 AS builder
ARG MCP_SERVER_BIN_NAME

WORKDIR /build
COPY ./apps/${MCP_SERVER_BIN_NAME}/ ./

RUN make build

# コンテナLambda実装
FROM public.ecr.aws/lambda/python:3.11
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

ARG MCP_SERVER_BIN_NAME

WORKDIR /app

COPY --from=builder /build/${MCP_SERVER_BIN_NAME} /app/${MCP_SERVER_BIN_NAME}
RUN chmod +x /app/${MCP_SERVER_BIN_NAME}

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY apps/smart-home-ai-agent/pyproject.toml /app/
COPY uv.lock /app/
RUN uv export -o requirements.txt --no-hashes --no-dev
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY apps/smart-home-ai-agent/src/ /app/src/

ENV PYTHONPATH="/app"
ENV MCP_BIN_PATH="./${MCP_SERVER_BIN_NAME}"

ENTRYPOINT ["uvicorn"]
CMD [ "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
