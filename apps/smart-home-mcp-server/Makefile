include .env

.DEFAULT_GOAL := help
BUILD_FLAGS := -ldflags "-s -w -X github.com/shuntaka9576/smart-home/apps/smart-home-mcp-server/home_api.APIBaseURL=$(SMART_HOME_API_GATEWAY_DOMAIN)"


build-dev: ## Build
	@echo "Building with SMART_HOME_API_GATEWAY_DOMAIN: $(SMART_HOME_API_GATEWAY_DOMAIN)"
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build $(BUILD_FLAGS) -o ../smart-home-ai-agent/smart-home-mcp-server

build: ## Build
	@echo "Building with SMART_HOME_API_GATEWAY_DOMAIN: $(SMART_HOME_API_GATEWAY_DOMAIN)"
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build $(BUILD_FLAGS) -o smart-home-mcp-server

help: ## Show options
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: help build
