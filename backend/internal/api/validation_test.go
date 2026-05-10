package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestParseEventDates(t *testing.T) {
	dateTo := "1703-06-01"
	dateFrom, parsedTo, err := parseEventDates(eventInput{
		Title:    "Founded",
		DateFrom: "1703-05-27",
		DateTo:   &dateTo,
	})
	if err != nil {
		t.Fatalf("parseEventDates returned error: %v", err)
	}
	if dateFrom.Format(dateLayout) != "1703-05-27" {
		t.Fatalf("unexpected date_from: %s", dateFrom.Format(dateLayout))
	}
	if parsedTo == nil || parsedTo.Format(dateLayout) != "1703-06-01" {
		t.Fatalf("unexpected date_to: %v", parsedTo)
	}
}

func TestParseEventDatesRejectsInvalidRange(t *testing.T) {
	dateTo := "1703-05-26"
	_, _, err := parseEventDates(eventInput{DateFrom: "1703-05-27", DateTo: &dateTo})
	if err == nil {
		t.Fatal("expected invalid date range error")
	}
}

func TestParseFlexibleDate(t *testing.T) {
	start, err := parseFlexibleDate("1703", false)
	if err != nil {
		t.Fatalf("parseFlexibleDate returned error: %v", err)
	}
	if !start.Equal(time.Date(1703, time.January, 1, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("unexpected start date: %v", start)
	}

	end, err := parseFlexibleDate("1703", true)
	if err != nil {
		t.Fatalf("parseFlexibleDate returned error: %v", err)
	}
	if !end.Equal(time.Date(1703, time.December, 31, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("unexpected end date: %v", end)
	}
}

func TestParseFlexibleDateRejectsInvalidValue(t *testing.T) {
	_, err := parseFlexibleDate("17xx", false)
	if err == nil {
		t.Fatal("expected invalid date filter error")
	}
}

func TestParsePositiveInt(t *testing.T) {
	if got := parsePositiveInt("", 25); got != 25 {
		t.Fatalf("empty value returned %d", got)
	}
	if got := parsePositiveInt("-1", 25); got != 25 {
		t.Fatalf("negative value returned %d", got)
	}
	if got := parsePositiveInt("501", 25); got != 500 {
		t.Fatalf("large value returned %d", got)
	}
	if got := parsePositiveInt("10", 25); got != 10 {
		t.Fatalf("valid value returned %d", got)
	}
}

func TestIsSourceType(t *testing.T) {
	for _, sourceType := range []string{"book", "article", "archive", "photo", "map", "web"} {
		if !isSourceType(sourceType) {
			t.Fatalf("%s should be accepted", sourceType)
		}
	}
	if isSourceType("video") {
		t.Fatal("unexpected source type accepted")
	}
}

func TestReadLocationInput(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/locations", strings.NewReader(`{
		"name":"Test",
		"description":"Description",
		"latitude":59.95,
		"longitude":30.31
	}`))
	rec := httptest.NewRecorder()

	input, ok := readLocationInput(rec, req)
	if !ok {
		t.Fatalf("readLocationInput failed: status=%d body=%s", rec.Code, rec.Body.String())
	}
	if input.Name != "Test" || input.Latitude != 59.95 || input.Longitude != 30.31 {
		t.Fatalf("unexpected input: %+v", input)
	}
}

func TestReadLocationInputRejectsInvalidLatitude(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/locations", strings.NewReader(`{
		"name":"Test",
		"latitude":100,
		"longitude":30.31
	}`))
	rec := httptest.NewRecorder()

	if _, ok := readLocationInput(rec, req); ok {
		t.Fatal("expected invalid latitude to be rejected")
	}
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("unexpected status: %d", rec.Code)
	}
}

func TestReadEventInput(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/events", strings.NewReader(`{
		"title":"Event",
		"description":"Description",
		"date_from":"1703-05-27",
		"tags":["tag"]
	}`))
	rec := httptest.NewRecorder()

	input, ok := readEventInput(rec, req)
	if !ok {
		t.Fatalf("readEventInput failed: status=%d body=%s", rec.Code, rec.Body.String())
	}
	if input.Title != "Event" || input.DateFrom != "1703-05-27" || len(input.Tags) != 1 {
		t.Fatalf("unexpected input: %+v", input)
	}
}

func TestReadSourceInputDefaultsType(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/sources", strings.NewReader(`{
		"title":"Source",
		"author":"Author"
	}`))
	rec := httptest.NewRecorder()

	input, ok := readSourceInput(rec, req)
	if !ok {
		t.Fatalf("readSourceInput failed: status=%d body=%s", rec.Code, rec.Body.String())
	}
	if input.Type != "web" {
		t.Fatalf("unexpected default source type: %s", input.Type)
	}
}

func TestReadJSONBodyRejectsUnknownFields(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/tags", strings.NewReader(`{"name":"tag","extra":true}`))
	rec := httptest.NewRecorder()

	var input tagInput
	if readJSONBody(rec, req, &input) {
		t.Fatal("expected unknown JSON field to be rejected")
	}
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("unexpected status: %d", rec.Code)
	}
}

func TestCORSPreflight(t *testing.T) {
	handler := cors(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("preflight should not call next handler")
	}))
	req := httptest.NewRequest(http.MethodOptions, "/api/events", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("unexpected status: %d", rec.Code)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Fatal("missing CORS origin header")
	}
}
