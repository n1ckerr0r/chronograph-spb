package config

import (
	"fmt"
	"os"
)

type Config struct {
	ServerAddr string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
}

func Load() (Config, error) {
	cfg := Config{
		ServerAddr: getEnv("SERVER_ADDR", ":8080"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "chronograph"),
		DBPassword: getEnv("DB_PASSWORD", "chronograph"),
		DBName:     getEnv("DB_NAME", "chronograph"),
	}

	if cfg.DBHost == "" || cfg.DBPort == "" || cfg.DBUser == "" || cfg.DBName == "" {
		return Config{}, fmt.Errorf("database config is incomplete")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
