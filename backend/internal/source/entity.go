package source

type Source struct {
	ID     int64  `json:"id"`
	Title  string `json:"title"`
	Author string `json:"author"`
	Year   *int   `json:"year,omitempty"`
	URL    string `json:"url"`
	Type   string `json:"type"`
}
