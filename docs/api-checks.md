# API checks

## Fast checks

Run unit tests without PostgreSQL:

```bash
cd backend
env GOCACHE=/tmp/chronograph-go-cache go test ./...
```

Validate Docker Compose structure:

```bash
docker compose config
```

## Full integration checks

Start PostgreSQL/PostGIS:

```bash
POSTGRES_PORT=55432 BACKEND_PORT=28080 docker compose -p chronograph_spb_test up -d postgres
```

Run tests against the temporary database:

```bash
cd backend
env GOCACHE=/tmp/chronograph-go-cache \
  TEST_DATABASE_URL=postgres://chronograph:chronograph@localhost:55432/chronograph \
  go test ./...
```

Stop and remove the temporary database:

```bash
POSTGRES_PORT=55432 BACKEND_PORT=28080 docker compose -p chronograph_spb_test down -v
```

## Manual API check

Start the full stack:

```bash
docker compose up --build
```

Open Swagger UI:

```text
http://localhost:8081
```

Swagger UI читает API-first контракт из `backend/api/openapi.yaml`.

Open frontend:

```text
http://localhost:3000
```

Backend health endpoint:

```bash
curl http://localhost:8080/health
```

Create a location:

```bash
curl -X POST http://localhost:8080/api/locations \
  -H 'Content-Type: application/json' \
  -d '{"name":"Петропавловская крепость","description":"Исторический центр","latitude":59.95,"longitude":30.3167}'
```

Create an event:

```bash
curl -X POST http://localhost:8080/api/events \
  -H 'Content-Type: application/json' \
  -d '{"title":"Основание Санкт-Петербурга","description":"Начало строительства города","date_from":"1703-05-27","location_id":1,"tags":["основание","XVIII век"]}'
```

Check filtered events:

```bash
curl 'http://localhost:8080/api/events?from=1700&to=1710&tag=основание'
```

Check GeoJSON:

```bash
curl 'http://localhost:8080/api/map/events.geojson?from=1700&to=1710'
```
