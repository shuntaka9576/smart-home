package main

import (
	"context"
	_ "embed"
	"io"
	"log/slog"
	"os"
)

//go:embed tools.json
var toolsjson []byte

func main() {
	var logger io.WriteCloser
	logger = os.Stderr
	defer logger.Close()
	setLogger(logger)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var server Server = NewStdioServer(os.Stdin, os.Stdout)
	server.Start(ctx)

	slog.Info("server started", "config", config)

	go worker(server)

	server.Wait()
	slog.Info("server finished")
}

func setLogger(w io.Writer) {
	logger := slog.New(slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))
	slog.SetDefault(logger)
}
