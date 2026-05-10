package api

import "net/http"

// eventsGeoJSON возвращает готовые для карты GeoJSON-точки событий с координатами.
func (api *API) eventsGeoJSON(w http.ResponseWriter, r *http.Request) {
	events, err := api.queryEvents(r.Context(), r.URL.Query(), false)
	if err != nil {
		handleAPIError(w, err)
		return
	}

	features := make([]map[string]any, 0, len(events))
	for _, item := range events {
		if item.Latitude == nil || item.Longitude == nil {
			continue
		}
		features = append(features, map[string]any{
			"type": "Feature",
			"geometry": map[string]any{
				"type":        "Point",
				"coordinates": []float64{*item.Longitude, *item.Latitude},
			},
			"properties": map[string]any{
				"id":            item.ID,
				"title":         item.Title,
				"description":   item.Description,
				"date_from":     item.DateFrom,
				"date_to":       item.DateTo,
				"location_id":   item.LocationID,
				"location_name": item.LocationName,
				"tags":          item.Tags,
			},
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"type":     "FeatureCollection",
		"features": features,
	})
}
