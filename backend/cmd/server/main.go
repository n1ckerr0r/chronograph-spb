package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/n1ckerr0r/chronograph-spb/backend/internal/config"
	"github.com/n1ckerr0r/chronograph-spb/backend/internal/database"
)

func main() {

	cfg := config.Load()

	db, err := database.New(cfg)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Database connected")

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	fmt.Println("Server started at :8080")

	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}

	defer db.Close()
}
