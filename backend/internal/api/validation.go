package api

import (
	"fmt"
	"net/http"
	"strings"
	"time"
)

func readLocationInput(w http.ResponseWriter, r *http.Request) (locationInput, bool) {
	var input locationInput
	if !readJSONBody(w, r, &input) {
		return locationInput{}, false
	}
	if strings.TrimSpace(input.Name) == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return locationInput{}, false
	}
	if input.Latitude < -90 || input.Latitude > 90 {
		writeError(w, http.StatusBadRequest, "latitude must be between -90 and 90")
		return locationInput{}, false
	}
	if input.Longitude < -180 || input.Longitude > 180 {
		writeError(w, http.StatusBadRequest, "longitude must be between -180 and 180")
		return locationInput{}, false
	}
	return input, true
}

func readEventInput(w http.ResponseWriter, r *http.Request) (eventInput, bool) {
	var input eventInput
	if !readJSONBody(w, r, &input) {
		return eventInput{}, false
	}
	if strings.TrimSpace(input.Title) == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return eventInput{}, false
	}
	if _, _, err := parseEventDates(input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return eventInput{}, false
	}
	return input, true
}

func readSourceInput(w http.ResponseWriter, r *http.Request) (sourceInput, bool) {
	var input sourceInput
	if !readJSONBody(w, r, &input) {
		return sourceInput{}, false
	}
	if strings.TrimSpace(input.Title) == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return sourceInput{}, false
	}
	if strings.TrimSpace(input.Type) == "" {
		input.Type = "web"
	}
	if !isSourceType(input.Type) {
		writeError(w, http.StatusBadRequest, "type must be one of book, article, archive, photo, map, web")
		return sourceInput{}, false
	}
	return input, true
}

func parseEventDates(input eventInput) (time.Time, *time.Time, error) {
	dateFrom, err := time.Parse(dateLayout, input.DateFrom)
	if err != nil {
		return time.Time{}, nil, fmt.Errorf("date_from must use YYYY-MM-DD")
	}

	var dateTo *time.Time
	if input.DateTo != nil && strings.TrimSpace(*input.DateTo) != "" {
		parsed, err := time.Parse(dateLayout, *input.DateTo)
		if err != nil {
			return time.Time{}, nil, fmt.Errorf("date_to must use YYYY-MM-DD")
		}
		if parsed.Before(dateFrom) {
			return time.Time{}, nil, fmt.Errorf("date_to must be greater than or equal to date_from")
		}
		dateTo = &parsed
	}

	return dateFrom, dateTo, nil
}

func isSourceType(value string) bool {
	switch value {
	case "book", "article", "archive", "photo", "map", "web":
		return true
	default:
		return false
	}
}
