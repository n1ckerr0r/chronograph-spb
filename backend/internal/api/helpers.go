package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

func replaceEventTags(ctx context.Context, tx pgx.Tx, eventID int64, tags []string) error {
	if _, err := tx.Exec(ctx, `DELETE FROM event_tag WHERE event_id=$1`, eventID); err != nil {
		return err
	}

	seen := make(map[string]struct{})
	for _, raw := range tags {
		name := strings.TrimSpace(raw)
		if name == "" {
			continue
		}
		if _, exists := seen[name]; exists {
			continue
		}
		seen[name] = struct{}{}

		var tagID int64
		err := tx.QueryRow(ctx, `
			INSERT INTO tag (name)
			VALUES ($1)
			ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
			RETURNING id`, name,
		).Scan(&tagID)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `INSERT INTO event_tag (event_id, tag_id) VALUES ($1, $2)`, eventID, tagID); err != nil {
			return err
		}
	}

	return nil
}

func scanSources(rows pgx.Rows) ([]sourceDTO, error) {
	items := make([]sourceDTO, 0)
	for rows.Next() {
		var item sourceDTO
		var year sql.NullInt64
		if err := rows.Scan(&item.ID, &item.Title, &item.Author, &year, &item.URL, &item.Type); err != nil {
			return nil, err
		}
		if year.Valid {
			value := int(year.Int64)
			item.Year = &value
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func parseFlexibleDate(value string, endOfYear bool) (time.Time, error) {
	if len(value) == 4 {
		year, err := strconv.Atoi(value)
		if err != nil {
			return time.Time{}, badRequestError("date filter must use YYYY or YYYY-MM-DD")
		}
		if endOfYear {
			return time.Date(year, time.December, 31, 0, 0, 0, 0, time.UTC), nil
		}
		return time.Date(year, time.January, 1, 0, 0, 0, 0, time.UTC), nil
	}

	parsed, err := time.Parse(dateLayout, value)
	if err != nil {
		return time.Time{}, badRequestError("date filter must use YYYY or YYYY-MM-DD")
	}
	return parsed, nil
}

func parsePositiveInt(value string, fallback int) int {
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed < 0 {
		return fallback
	}
	if parsed > 500 {
		return 500
	}
	return parsed
}

func pathID(w http.ResponseWriter, r *http.Request, name string) (int64, bool) {
	value := r.PathValue(name)
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, name+" must be a positive integer")
		return 0, false
	}
	return id, true
}

func readJSONBody(w http.ResponseWriter, r *http.Request, dst any) bool {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body: "+err.Error())
		return false
	}
	return true
}

func handleDBError(w http.ResponseWriter, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "resource not found")
		return
	}
	writeError(w, http.StatusInternalServerError, err.Error())
}

type badRequestError string

func (err badRequestError) Error() string {
	return string(err)
}

func handleAPIError(w http.ResponseWriter, err error) {
	var badRequest badRequestError
	if errors.As(err, &badRequest) {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	handleDBError(w, err)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
