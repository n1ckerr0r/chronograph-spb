package event

import "time"

type Event struct {
	ID          int64
	Title       string
	Description string
	DateFrom    time.Time
	DateTo      *time.Time
	LocationID  int64
	CreatedAt   time.Time
}
