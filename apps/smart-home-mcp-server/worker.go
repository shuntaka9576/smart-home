package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"strings"

	"github.com/shuntaka9576/smart-home/apps/smart-home-mcp-server/home_api"
)

func worker(server Server) {
	for msg := range server.ReadChannel() {
		slog.Info("received message", "method", msg.Method, "id", msg.ID)
		if strings.HasPrefix(msg.Method, "notifications/") {
			slog.Debug("notification", "msg", msg)
			continue
		}

		switch msg.Method {
		case "initialize":
			resp := JSONRPCResponse{
				JSONRPC: "2.0",
				ID:      msg.ID,
				Result:  map[string]any{"protocolVersion": "2024-11-05", "capabilities": map[string]any{"experimental": map[string]any{}, "prompts": map[string]any{"listChanged": false}, "resources": map[string]any{"subscribe": false, "listChanged": false}, "tools": map[string]any{"listChanged": false}}, "serverInfo": map[string]any{"name": "smart-home-mcp-server", "version": "0.1.0"}},
			}
			slog.Debug("sending initialize response", "msg", resp)
			server.WriteChannel() <- resp

		case "tools/list":
			var resp JSONRPCResponse
			json.Unmarshal(toolsjson, &resp)
			resp.ID = msg.ID
			slog.Debug("sending tools response", "msg", msg)
			server.WriteChannel() <- resp

		case "tools/call":
			slog.Debug("sending tools/call", "msg", msg)
			if msg.Params.Name == "list-home-condition" {
				slog.Debug("call list-home-condition", "config", config)

				since, okSince := msg.Params.Args["since"].(string)
				until, okUntil := msg.Params.Args["until"].(string)
				if !okSince || !okUntil {
					slog.Error("invalid arguments provided for since/until")
					return
				}

				client := home_api.NewClient()
				homeCondition, err := client.GetHomeConditions(context.TODO(), since, until)
				if err != nil {
					slog.Error("api request error")
				}

				jsonHomeCondition, err := json.Marshal(homeCondition)
				if err != nil {
					slog.Error("api request error")
				}

				slog.Debug("call list-home-condition api", "homeCondition", homeCondition)

				resp := JSONRPCResponse{
					JSONRPC: "2.0",
					ID:      msg.ID,
					Result:  map[string]any{"content": []map[string]any{{"type": "text", "text": string(jsonHomeCondition)}}},
				}
				slog.Debug("sending tools/call append-insight response", "msg", msg, "resp", resp)

				server.WriteChannel() <- resp
				continue
			}
		default:
			slog.Info("unknown method called", "method", msg.Method)
		}
	}
}
