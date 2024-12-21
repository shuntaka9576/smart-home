package main

type Config struct {
}

var config Config

func init() {
	config = Config{}
}

func getConfig() Config {
	return config
}
