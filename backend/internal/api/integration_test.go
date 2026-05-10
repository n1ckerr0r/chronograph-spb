package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestIntegrationLocationCRUD(t *testing.T) {
	handler, _ := newIntegrationAPI(t)

	location := postJSON[locationDTO](t, handler, "/api/locations", `{
		"name":"Адмиралтейство",
		"description":"Главное адмиралтейство",
		"latitude":59.9375,
		"longitude":30.3086
	}`, http.StatusCreated)
	if location.ID == 0 || location.Name != "Адмиралтейство" {
		t.Fatalf("unexpected location: %+v", location)
	}

	updated := putJSON[locationDTO](t, handler, "/api/locations/"+itoa(location.ID), `{
		"name":"Адмиралтейство обновлено",
		"description":"Обновленное описание",
		"latitude":59.938,
		"longitude":30.309
	}`, http.StatusOK)
	if updated.Name != "Адмиралтейство обновлено" {
		t.Fatalf("location was not updated: %+v", updated)
	}

	getJSON[[]locationDTO](t, handler, "/api/locations", http.StatusOK)
	deleteRequest(t, handler, "/api/locations/"+itoa(location.ID), http.StatusNoContent)
	getRequest(t, handler, "/api/locations/"+itoa(location.ID), http.StatusNotFound)
}

func TestIntegrationTagCRUD(t *testing.T) {
	handler, _ := newIntegrationAPI(t)

	tag := postJSON[tagDTO](t, handler, "/api/tags", `{"name":"архитектура"}`, http.StatusCreated)
	if tag.ID == 0 || tag.Name != "архитектура" {
		t.Fatalf("unexpected tag: %+v", tag)
	}

	updated := putJSON[tagDTO](t, handler, "/api/tags/"+itoa(tag.ID), `{"name":"градостроительство"}`, http.StatusOK)
	if updated.Name != "градостроительство" {
		t.Fatalf("tag was not updated: %+v", updated)
	}

	tags := getJSON[[]tagDTO](t, handler, "/api/tags", http.StatusOK)
	if !hasTag(tags, updated.ID, "градостроительство") {
		t.Fatalf("unexpected tags: %+v", tags)
	}

	deleteRequest(t, handler, "/api/tags/"+itoa(tag.ID), http.StatusNoContent)
}

func TestIntegrationSourceCRUDAndEventLinks(t *testing.T) {
	handler, _ := newIntegrationAPI(t)
	event := createIntegrationEvent(t, handler)

	source := postJSON[sourceDTO](t, handler, "/api/sources", `{
		"title":"Архивный источник",
		"author":"ЦГИА СПб",
		"year":1900,
		"url":"https://example.test/source",
		"type":"archive"
	}`, http.StatusCreated)

	postRequest(t, handler, "/api/events/"+itoa(event.ID)+"/sources/"+itoa(source.ID), "", http.StatusNoContent)
	linked := getJSON[[]sourceDTO](t, handler, "/api/events/"+itoa(event.ID)+"/sources", http.StatusOK)
	if len(linked) != 1 || linked[0].ID != source.ID {
		t.Fatalf("unexpected linked sources: %+v", linked)
	}

	updated := putJSON[sourceDTO](t, handler, "/api/sources/"+itoa(source.ID), `{
		"title":"Обновленный источник",
		"author":"ЦГИА СПб",
		"year":1901,
		"url":"https://example.test/source-updated",
		"type":"archive"
	}`, http.StatusOK)
	if updated.Title != "Обновленный источник" {
		t.Fatalf("source was not updated: %+v", updated)
	}

	deleteRequest(t, handler, "/api/events/"+itoa(event.ID)+"/sources/"+itoa(source.ID), http.StatusNoContent)
	deleteRequest(t, handler, "/api/sources/"+itoa(source.ID), http.StatusNoContent)
}

func TestIntegrationEventCRUDAndGeoJSON(t *testing.T) {
	handler, _ := newIntegrationAPI(t)
	location := createIntegrationLocation(t, handler)

	event := postJSON[eventDTO](t, handler, "/api/events", `{
		"title":"Основание Санкт-Петербурга",
		"description":"Начало строительства города",
		"date_from":"1703-05-27",
		"location_id":`+itoa(location.ID)+`,
		"tags":["основание","XVIII век"]
	}`, http.StatusCreated)
	if event.ID == 0 || event.LocationID == nil || *event.LocationID != location.ID {
		t.Fatalf("unexpected event: %+v", event)
	}

	events := getJSON[[]eventDTO](t, handler, "/api/events?from=1700&to=1710&tag=основание", http.StatusOK)
	if !hasEvent(events, event.ID) {
		t.Fatalf("unexpected filtered events: %+v", events)
	}

	geojson := getJSON[map[string]any](t, handler, "/api/map/events.geojson?from=1700&to=1710", http.StatusOK)
	if geojson["type"] != "FeatureCollection" {
		t.Fatalf("unexpected geojson: %+v", geojson)
	}

	updated := putJSON[eventDTO](t, handler, "/api/events/"+itoa(event.ID), `{
		"title":"Основание города",
		"description":"Обновленное описание",
		"date_from":"1703-05-27",
		"location_id":`+itoa(location.ID)+`,
		"tags":["основание"]
	}`, http.StatusOK)
	if updated.Title != "Основание города" || len(updated.Tags) != 1 {
		t.Fatalf("event was not updated: %+v", updated)
	}

	deleteRequest(t, handler, "/api/events/"+itoa(event.ID), http.StatusNoContent)
}

func TestIntegrationMediaCRUD(t *testing.T) {
	handler, _ := newIntegrationAPI(t)
	event := createIntegrationEvent(t, handler)

	media := postJSON[mediaDTO](t, handler, "/api/events/"+itoa(event.ID)+"/media", `{
		"url":"https://example.test/photo.jpg",
		"caption":"Фото",
		"type":"image"
	}`, http.StatusCreated)
	if media.ID == 0 || media.EventID != event.ID {
		t.Fatalf("unexpected media: %+v", media)
	}

	items := getJSON[[]mediaDTO](t, handler, "/api/events/"+itoa(event.ID)+"/media", http.StatusOK)
	if len(items) != 1 || items[0].ID != media.ID {
		t.Fatalf("unexpected media list: %+v", items)
	}

	deleteRequest(t, handler, "/api/media/"+itoa(media.ID), http.StatusNoContent)
}

func newIntegrationAPI(t *testing.T) (http.Handler, *pgxpool.Pool) {
	t.Helper()

	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("connect test database: %v", err)
	}
	t.Cleanup(pool.Close)

	resetIntegrationDatabase(t, pool)
	return New(pool), pool
}

func resetIntegrationDatabase(t *testing.T, pool *pgxpool.Pool) {
	t.Helper()

	ctx := context.Background()
	_, err := pool.Exec(ctx, `
		DROP TABLE IF EXISTS media, event_source, source, event_tag, tag, event, location CASCADE;
		DROP TYPE IF EXISTS source_type CASCADE;
	`)
	if err != nil {
		t.Fatalf("reset test database: %v", err)
	}

	migrationDir := filepath.Join("..", "..", "migrations")
	entries, err := os.ReadDir(migrationDir)
	if err != nil {
		t.Fatalf("read migrations: %v", err)
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}
		sqlBytes, err := os.ReadFile(filepath.Join(migrationDir, entry.Name()))
		if err != nil {
			t.Fatalf("read migration %s: %v", entry.Name(), err)
		}
		if _, err := pool.Exec(ctx, string(sqlBytes)); err != nil {
			t.Fatalf("apply migration %s: %v", entry.Name(), err)
		}
	}
}

func createIntegrationLocation(t *testing.T, handler http.Handler) locationDTO {
	t.Helper()
	return postJSON[locationDTO](t, handler, "/api/locations", `{
		"name":"Петропавловская крепость",
		"description":"Исторический центр",
		"latitude":59.95,
		"longitude":30.3167
	}`, http.StatusCreated)
}

func createIntegrationEvent(t *testing.T, handler http.Handler) eventDTO {
	t.Helper()
	location := createIntegrationLocation(t, handler)
	return postJSON[eventDTO](t, handler, "/api/events", `{
		"title":"Тестовое событие",
		"description":"Описание",
		"date_from":"1703-05-27",
		"location_id":`+itoa(location.ID)+`,
		"tags":["test"]
	}`, http.StatusCreated)
}

func postJSON[T any](t *testing.T, handler http.Handler, path string, body string, expectedStatus int) T {
	t.Helper()
	return jsonRequest[T](t, handler, http.MethodPost, path, body, expectedStatus)
}

func putJSON[T any](t *testing.T, handler http.Handler, path string, body string, expectedStatus int) T {
	t.Helper()
	return jsonRequest[T](t, handler, http.MethodPut, path, body, expectedStatus)
}

func getJSON[T any](t *testing.T, handler http.Handler, path string, expectedStatus int) T {
	t.Helper()
	return jsonRequest[T](t, handler, http.MethodGet, path, "", expectedStatus)
}

func getRequest(t *testing.T, handler http.Handler, path string, expectedStatus int) {
	t.Helper()
	request(t, handler, http.MethodGet, path, "", expectedStatus)
}

func putRequest(t *testing.T, handler http.Handler, path string, body string, expectedStatus int) {
	t.Helper()
	request(t, handler, http.MethodPut, path, body, expectedStatus)
}

func postRequest(t *testing.T, handler http.Handler, path string, body string, expectedStatus int) {
	t.Helper()
	request(t, handler, http.MethodPost, path, body, expectedStatus)
}

func deleteRequest(t *testing.T, handler http.Handler, path string, expectedStatus int) {
	t.Helper()
	request(t, handler, http.MethodDelete, path, "", expectedStatus)
}

func jsonRequest[T any](t *testing.T, handler http.Handler, method string, path string, body string, expectedStatus int) T {
	t.Helper()
	rec := request(t, handler, method, path, body, expectedStatus)

	var output T
	if err := json.Unmarshal(rec.Body.Bytes(), &output); err != nil {
		t.Fatalf("decode %s %s response: %v\nbody: %s", method, path, err, rec.Body.String())
	}
	return output
}

func request(t *testing.T, handler http.Handler, method string, path string, body string, expectedStatus int) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != expectedStatus {
		t.Fatalf("%s %s returned status %d, want %d; body=%s", method, path, rec.Code, expectedStatus, rec.Body.String())
	}
	return rec
}

func itoa(value int64) string {
	return strconv.FormatInt(value, 10)
}

func hasTag(tags []tagDTO, id int64, name string) bool {
	for _, tag := range tags {
		if tag.ID == id && tag.Name == name {
			return true
		}
	}
	return false
}

func hasEvent(events []eventDTO, id int64) bool {
	for _, event := range events {
		if event.ID == id {
			return true
		}
	}
	return false
}
