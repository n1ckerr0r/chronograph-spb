CREATE TABLE location (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    geometry GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT location_latitude_check CHECK (ST_Y(geometry) BETWEEN -90 AND 90),
    CONSTRAINT location_longitude_check CHECK (ST_X(geometry) BETWEEN -180 AND 180)
);

CREATE INDEX idx_location_geometry ON location USING GIST (geometry);

CREATE TABLE event (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    date_from DATE NOT NULL,
    date_to DATE,
    location_id INTEGER REFERENCES location(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT event_date_range_check CHECK (date_to IS NULL OR date_to >= date_from)
);

CREATE INDEX idx_event_date_from ON event(date_from);
CREATE INDEX idx_event_date_range ON event(date_from, date_to);
CREATE INDEX idx_event_location_id ON event(location_id);
