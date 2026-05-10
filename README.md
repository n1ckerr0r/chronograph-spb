# chronograph-spb

`chronograph-spb` - интерактивная карта истории Санкт-Петербурга. Приложение показывает городские объекты, связанные с ними исторические события, изображения, теги и источники данных.

Проект можно использовать как пользовательское приложение для просмотра истории города и как техническую основу для дальнейшего развития: добавления админки, авторизации, загрузки файлов, расширенной фильтрации и production-деплоя.

## Для пользователя

Откройте frontend в браузере:

```text
http://localhost:23000
```

Если проект запущен на стандартных портах, адрес будет:

```text
http://localhost:3000
```

На экране есть карта Санкт-Петербурга и боковая панель с карточками.

Что можно делать:

- смотреть исторические события на карте;
- переключаться между списком событий и списком объектов;
- искать по названию, месту и описанию;
- фильтровать события по периоду;
- фильтровать события по тегу;
- нажимать на событие или объект в списке;
- нажимать на точку события или маркер объекта на карте;
- смотреть подробную карточку выбранного события;
- смотреть изображение, описание, дату, место и теги события;
- открывать media-ссылки события;
- видеть выбранный объект или событие на карте: карта центрируется на нем, появляется popup и визуальная подсветка.

## Что сейчас реализовано

В базе есть 100 реальных городских объектов и 100 связанных исторических событий. Среди объектов есть крепости, дворцы, соборы, музеи, театры, вокзалы, мосты, площади, сады, промышленные территории, мемориалы и современные городские доминанты.

Основные сущности:

- `Location` - городской объект или место на карте.
- `Event` - историческое событие, связанное с объектом.
- `Tag` - тематическая метка события.
- `Source` - источник, на который можно опираться при описании события.
- `Media` - изображение или ссылка, привязанная к событию.

Теги сейчас работают только с событиями. У объектов отдельных тегов нет: объект попадает в тематическую выдачу через события, которые к нему привязаны.

Media сейчас хранит URL, подпись и тип (`image`, `link`). Файлы не загружаются внутрь приложения: изображения и ссылки берутся из внешних источников. Это проще для текущей версии и не требует отдельного файлового хранилища.

## Для разработчиков

Проект состоит из трех основных частей:

- `frontend` - React + TypeScript приложение на Vite.
- `backend` - Go API-first backend.
- `postgres` - PostgreSQL с PostGIS.

Карты на frontend рисуются через MapLibre GL. Backend отдает JSON API и GeoJSON endpoint для точек на карте. Данные хранятся в PostgreSQL, координаты объектов хранятся через PostGIS в формате `GEOMETRY(Point, 4326)`.

## Архитектура

Frontend:

```text
frontend/src/App.tsx        состояние приложения, загрузка данных
frontend/src/MapView.tsx    карта, маркеры, подсветка выбранных объектов
frontend/src/SidePanel.tsx  фильтры, списки, detail-карточка
frontend/src/api.ts         HTTP-клиент к backend API
frontend/src/types.ts       TypeScript-типы DTO
frontend/src/images.ts      fallback-изображения для карточек
```

Backend:

```text
backend/api/openapi.yaml              главный OpenAPI-контракт
backend/internal/openapi/             сгенерированный Go-код по OpenAPI
backend/internal/api/                 HTTP-обработчики и реализация API
backend/internal/database/            подключение к PostgreSQL
backend/internal/config/              конфигурация приложения
backend/migrations/                   схема БД и seed-данные
```

Docker:

```text
docker-compose.yml
backend/Dockerfile
frontend/Dockerfile
```

## API-first подход

Backend работает по API-first модели. Главный контракт находится здесь:

```text
backend/api/openapi.yaml
```

Из OpenAPI генерируются Go-типы и HTTP-роутинг:

```text
backend/internal/openapi/openapi.gen.go
```

Реальная бизнес-логика реализует сгенерированный интерфейс в:

```text
backend/internal/api/contract.go
```

После изменения OpenAPI нужно регенерировать backend-код:

```bash
cd backend
PATH=/home/n1ckerr0r/go/bin:$PATH GOCACHE=/tmp/chronograph-go-cache go generate ./internal/openapi
go test ./...
```

Swagger UI читает тот же `openapi.yaml`, поэтому документация и backend-контракт остаются синхронизированными.

## Запуск

Обычный запуск:

```bash
docker compose up --build
```

Адреса по умолчанию:

```text
Frontend:   http://localhost:3000
Backend:    http://localhost:8080
Swagger UI: http://localhost:8081
PostgreSQL: localhost:5432
```

Если стандартные порты заняты, можно поднять проект на других портах:

```bash
POSTGRES_PORT=55432 \
BACKEND_PORT=28080 \
FRONTEND_PORT=23000 \
SWAGGER_PORT=28081 \
VITE_API_BASE_URL=http://localhost:28080 \
docker compose up -d --build
```

Тогда адреса будут:

```text
Frontend:   http://localhost:23000
Backend:    http://localhost:28080
Swagger UI: http://localhost:28081
PostgreSQL: localhost:55432
```

## Проверка API

Healthcheck:

```bash
curl http://localhost:8080/health
```

Получить события:

```bash
curl 'http://localhost:8080/api/events?limit=20'
```

Получить события за период:

```bash
curl 'http://localhost:8080/api/events?from=1700&to=2026&limit=100'
```

Получить объекты:

```bash
curl 'http://localhost:8080/api/locations'
```

Получить теги:

```bash
curl 'http://localhost:8080/api/tags'
```

Получить GeoJSON для карты:

```bash
curl 'http://localhost:8080/api/map/events.geojson?from=1700&to=2026&limit=100'
```

Получить media события:

```bash
curl 'http://localhost:8080/api/events/1000/media'
```

Создать объект:

```bash
curl -X POST http://localhost:8080/api/locations \
  -H 'Content-Type: application/json' \
  -d '{"name":"Новый объект","description":"Описание","latitude":59.93,"longitude":30.31}'
```

Создать событие:

```bash
curl -X POST http://localhost:8080/api/events \
  -H 'Content-Type: application/json' \
  -d '{"title":"Новое событие","description":"Описание","date_from":"1900-01-01","location_id":1,"tags":["пример"]}'
```

Добавить media к событию:

```bash
curl -X POST http://localhost:8080/api/events/1/media \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.test/photo.jpg","caption":"Фото объекта","type":"image"}'
```

## Swagger

Swagger UI:

```text
http://localhost:8081
```

При запуске на текущих кастомных портах:

```text
http://localhost:28081
```

Через Swagger можно посмотреть все endpoints, схемы запросов и ответов, а также вручную выполнить запросы к API.

## Данные и миграции

Миграции лежат здесь:

```text
backend/migrations/
```

Сейчас они применяются через PostgreSQL init directory:

```text
/docker-entrypoint-initdb.d
```

Это значит:

- SQL-файлы выполняются при первом создании Docker volume;
- если volume уже существует, новые SQL-файлы автоматически не применятся;
- seed-данные сохраняются, пока сохраняется Docker volume `postgres_data`.

Для полной пересборки dev-базы:

```bash
docker compose down -v
docker compose up --build
```

Для production следующим шагом лучше добавить отдельный мигратор, например `goose`, `tern` или `golang-migrate`, чтобы применять новые миграции без удаления данных.

## Тесты

Backend:

```bash
cd backend
GOCACHE=/tmp/chronograph-go-cache go test ./...
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

Integration tests с PostGIS:

```bash
POSTGRES_PORT=55432 docker compose -p chronograph_backend_test up -d postgres

cd backend
GOCACHE=/tmp/chronograph-go-cache \
TEST_DATABASE_URL=postgres://chronograph:chronograph@localhost:55432/chronograph \
go test ./...

cd ..
POSTGRES_PORT=55432 docker compose -p chronograph_backend_test down -v
```

## Как это работает по потоку данных

1. Пользователь открывает frontend.
2. React-приложение запрашивает у backend события, объекты, теги и GeoJSON.
3. Backend читает данные из PostgreSQL/PostGIS.
4. Frontend рисует карту MapLibre и карточки в боковой панели.
5. При выборе события frontend запрашивает media этого события.
6. Карта центрируется на выбранной точке и подсвечивает событие или объект.

## Текущие ограничения

- Нет авторизации и ролей.
- Нет административного UI для редактирования данных.
- Нет загрузки файлов на сервер, media хранит внешние URL.
- У объектов пока нет отдельной таблицы media.
- Нет отдельного production-мигратора.
- CORS открыт для всех origin.
- API возвращает массивы без meta-информации пагинации.
