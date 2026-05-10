package config

import "testing"

func TestLoadUsesDefaults(t *testing.T) {
	t.Setenv("SERVER_ADDR", "")
	t.Setenv("DB_HOST", "")
	t.Setenv("DB_PORT", "")
	t.Setenv("DB_USER", "")
	t.Setenv("DB_PASSWORD", "")
	t.Setenv("DB_NAME", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}

	if cfg.ServerAddr != ":8080" {
		t.Fatalf("unexpected server addr: %s", cfg.ServerAddr)
	}
	if cfg.DBHost != "localhost" || cfg.DBPort != "5432" || cfg.DBUser != "chronograph" || cfg.DBPassword != "chronograph" || cfg.DBName != "chronograph" {
		t.Fatalf("unexpected default config: %+v", cfg)
	}
}

func TestLoadUsesEnvironment(t *testing.T) {
	t.Setenv("SERVER_ADDR", ":9000")
	t.Setenv("DB_HOST", "postgres")
	t.Setenv("DB_PORT", "55432")
	t.Setenv("DB_USER", "user")
	t.Setenv("DB_PASSWORD", "password")
	t.Setenv("DB_NAME", "database")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}

	if cfg.ServerAddr != ":9000" || cfg.DBHost != "postgres" || cfg.DBPort != "55432" || cfg.DBUser != "user" || cfg.DBPassword != "password" || cfg.DBName != "database" {
		t.Fatalf("unexpected env config: %+v", cfg)
	}
}
