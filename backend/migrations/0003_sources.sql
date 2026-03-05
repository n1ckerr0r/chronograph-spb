CREATE TYPE source_type AS ENUM (
    'book',
    'article',
    'archive',
    'photo',
    'map'
);

CREATE TABLE source (
    id SERIAL PRIMARY KEY,
    title TEXT,
    author TEXT,
    year INTEGER,
    url TEXT,
    type source_type
);

CREATE TABLE event_sources (
    event_id INTEGER REFERENCES event(id) ON DELETE CASCADE,
    source_id INTEGER REFERENCES source(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, source_id)
);

CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES event(id) ON DELETE CASCADE,
    url TEXT,
    caption TEXT
);