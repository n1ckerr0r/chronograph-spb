CREATE TABLE tag (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE event_tag (
    event_id INTEGER REFERENCES event(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tag(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, tag_id)
);

CREATE INDEX idx_event_tag_tag_id ON event_tag(tag_id);

CREATE TYPE source_type AS ENUM (
    'book',
    'article',
    'archive',
    'photo',
    'map',
    'web'
);

CREATE TABLE source (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    year INTEGER,
    url TEXT NOT NULL DEFAULT '',
    type source_type NOT NULL DEFAULT 'web'
);

CREATE TABLE event_source (
    event_id INTEGER REFERENCES event(id) ON DELETE CASCADE,
    source_id INTEGER REFERENCES source(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, source_id)
);

CREATE INDEX idx_event_source_source_id ON event_source(source_id);

CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES event(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'image'
);

CREATE INDEX idx_media_event_id ON media(event_id);
