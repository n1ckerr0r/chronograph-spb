# Backend

Backend реализует API цифрового хронографа Санкт-Петербурга: хранит исторические объекты, события, теги, источники, медиа и отдает данные для карты в JSON и GeoJSON.

## Что реализовано

- API-first HTTP API по контракту `api/openapi.yaml`.
- PostgreSQL/PostGIS хранение координат объектов через `GEOMETRY(Point, 4326)`.
- CRUD для объектов, событий, тегов, источников и медиа.
- Связи событий с тегами и источниками.
- GeoJSON endpoint для карты: `GET /api/map/events.geojson`.
- Healthcheck с проверкой подключения к базе: `GET /health`.
- Seed-данные для первого деплоя: 8 объектов Петербурга, события, теги, источники и связи.
- Unit и интеграционные тесты.

## Структура

```text
api/
  openapi.yaml          # главный API-first контракт
  oapi-codegen.yaml     # конфиг генерации Go-кода из OpenAPI
cmd/server/
  main.go               # точка входа HTTP-сервера
internal/openapi/
  openapi.gen.go        # сгенерированные типы и роутинг
  generate.go           # go:generate команда
internal/api/
  contract.go           # реализация сгенерированного ServerInterface
  *.go                  # бизнес-логика HTTP handlers и SQL-операций
internal/config/
  config.go             # конфигурация из env
internal/database/
  postgres.go           # подключение к pgxpool
migrations/
  0001_extensions.sql
  0002_locations_events.sql
  0003_tags_sources_media.sql
  0004_seed_data.sql
```

## API-first поток

Источник истины для API - `api/openapi.yaml`. Роутинг и Go-типы генерируются из него через `oapi-codegen`.

После изменения `api/openapi.yaml` нужно выполнить:

```bash
PATH=/home/n1ckerr0r/go/bin:$PATH GOCACHE=/tmp/chronograph-go-cache go generate ./internal/openapi
go test ./...
```

Сгенерированный файл `internal/openapi/openapi.gen.go` коммитится в репозиторий, чтобы сборка backend не требовала установленного генератора.

Swagger UI в `docker-compose.yml` читает тот же контракт:

```text
../backend/api/openapi.yaml
```

## Конфигурация

Backend читает настройки из env:

| Env | Default | Назначение |
| --- | --- | --- |
| `SERVER_ADDR` | `:8080` | адрес HTTP-сервера |
| `DB_HOST` | `localhost` | host PostgreSQL |
| `DB_PORT` | `5432` | порт PostgreSQL |
| `DB_USER` | `chronograph` | пользователь PostgreSQL |
| `DB_PASSWORD` | `chronograph` | пароль PostgreSQL |
| `DB_NAME` | `chronograph` | имя базы |

В Docker Compose backend подключается к сервису `postgres`, а наружу порт задается переменной `BACKEND_PORT`.

## Миграции и seed-данные

Сейчас миграции применяются через монтирование `migrations/` в `/docker-entrypoint-initdb.d` контейнера PostgreSQL. Это важно:

- SQL-файлы выполняются только при первом создании PostgreSQL volume.
- Если volume уже существует, новые миграции автоматически не применятся.
- Для чистой dev-базы можно пересоздать volume:

```bash
docker compose down -v
docker compose up --build
```

`0004_seed_data.sql` добавляет стартовые данные. Эти данные сохраняются при деплое, пока сохраняется volume `postgres_data`.

Для production следующая техническая задача - заменить initdb-подход на нормальный мигратор (`goose`, `tern` или `golang-migrate`), чтобы новые миграции применялись без удаления данных.

## Данные и важные правила

- Координаты объектов хранятся в PostGIS как `geometry`.
- API принимает и отдает координаты как `latitude` и `longitude`.
- Для PostGIS используется порядок `ST_MakePoint(longitude, latitude)`.
- Удаление location не удаляет события: у событий `location_id` становится `NULL`.
- Удаление event каскадно удаляет связи с тегами, источниками и медиа.
- `date_from` обязателен для события.
- `date_to` может быть `NULL`, но если задан, должен быть не раньше `date_from`.
- Фильтры `from` и `to` принимают `YYYY` или `YYYY-MM-DD`.
- `limit` ограничивается максимумом `500`.
- CORS сейчас открыт для всех origin. Перед production это лучше ограничить доменом frontend.

## Запуск

Локально без Docker:

```bash
go run ./cmd/server
```

Через Docker Compose из корня проекта:

```bash
docker compose up --build
```

По умолчанию compose публикует PostgreSQL на `55432`, чтобы не конфликтовать с локальным PostgreSQL или другими проектами на `5432`. Если этот порт тоже занят:

```bash
POSTGRES_PORT=55433 BACKEND_PORT=28080 docker compose up -d --build postgres backend
```

## Проверка

Быстрые тесты без PostgreSQL:

```bash
GOCACHE=/tmp/chronograph-go-cache go test ./...
```

Интеграционные тесты требуют PostgreSQL/PostGIS и `TEST_DATABASE_URL`:

```bash
POSTGRES_PORT=55432 docker compose -p chronograph_backend_test up -d postgres

GOCACHE=/tmp/chronograph-go-cache \
TEST_DATABASE_URL=postgres://chronograph:chronograph@localhost:55432/chronograph \
go test ./...

POSTGRES_PORT=55432 docker compose -p chronograph_backend_test down -v
```

Healthcheck:

```bash
curl http://localhost:8080/health
```

Проверка seed-данных:

```bash
curl 'http://localhost:8080/api/events?limit=20'
curl 'http://localhost:8080/api/map/events.geojson?from=1700&to=1917'
```

## Ограничения текущей версии

- Нет auth/roles/admin-панели.
- Нет отдельного мигратора для существующих production-баз.
- Нет пагинационной метаинформации, API возвращает только массивы.
- Источники и media сейчас хранят URL как строки, без загрузки файлов.
- Ошибки БД пока возвращаются как текст в JSON `{"error": "..."}`; для production лучше нормализовать error codes.
