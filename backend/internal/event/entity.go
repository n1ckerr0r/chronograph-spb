package event

import "time"

type Event struct {
	ID           int64      `json:"id"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	DateFrom     time.Time  `json:"date_from"`
	DateTo       *time.Time `json:"date_to,omitempty"`
	LocationID   *int64     `json:"location_id,omitempty"`
	LocationName string     `json:"location_name,omitempty"`
	Tags         []string   `json:"tags"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}
