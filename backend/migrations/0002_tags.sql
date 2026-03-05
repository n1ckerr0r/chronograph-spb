CREATE TABLE tag (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE event_tag (
    event_id INT REFERENCES event (id) ON DELETE CASCADE,
    tag_id   INT REFERENCES tag (id) ON DELETE CASCADE
)