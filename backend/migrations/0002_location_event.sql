CREATE TABLE location (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    geometry GEOMETRY(Point, 4326)
);

CREATE INDEX idx_locations_geom ON location
USING GIST (geometry);

CREATE TABLE event (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date_from DATE,
    date_to DATE,
    location_id INT REFERENCES location(id)
);

CREATE INDEX idx_event_date_from ON event(date_from)
-- Скорее всего нужно добавить много индексов, будет много фильтров
