package main

import (
	"log"
	"net/http"

	"github.com/n1ckerr0r/chronograph-spb/backend/internal/api"
	"github.com/n1ckerr0r/chronograph-spb/backend/internal/config"
	"github.com/n1ckerr0r/chronograph-spb/backend/internal/database"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	db, err := database.New(cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	log.Printf("server started at %s", cfg.ServerAddr)
	if err := http.ListenAndServe(cfg.ServerAddr, api.New(db)); err != nil {
		log.Fatal(err)
	}
}
