package database

import (
	"context"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/n1ckerr0r/chronograph-spb/backend/internal/config"
)

func TestNewReturnsErrorForUnavailableDatabase(t *testing.T) {
	_, err := New(config.Config{
		DBHost:     "127.0.0.1",
		DBPort:     "1",
		DBUser:     "chronograph",
		DBPassword: "chronograph",
		DBName:     "chronograph",
	})
	if err == nil {
		t.Fatal("expected connection error")
	}
}

func TestNewIntegration(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	cfg, ok := configFromDatabaseURL(t, dsn)
	if !ok {
		t.Skip("TEST_DATABASE_URL must use postgres://user:password@host:port/db")
	}

	pool, err := New(cfg)
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		t.Fatalf("Ping returned error: %v", err)
	}
}

func configFromDatabaseURL(t *testing.T, rawURL string) (config.Config, bool) {
	t.Helper()

	parsed, err := url.Parse(rawURL)
	if err != nil {
		t.Fatalf("parse TEST_DATABASE_URL: %v", err)
	}
	if parsed.Scheme != "postgres" && parsed.Scheme != "postgresql" {
		return config.Config{}, false
	}

	password, _ := parsed.User.Password()
	host := parsed.Hostname()
	port := parsed.Port()
	dbName := strings.TrimPrefix(parsed.Path, "/")
	if host == "" || port == "" || parsed.User.Username() == "" || dbName == "" {
		return config.Config{}, false
	}

	return config.Config{
		DBHost:     host,
		DBPort:     port,
		DBUser:     parsed.User.Username(),
		DBPassword: password,
		DBName:     dbName,
	}, true
}
