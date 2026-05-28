import type { Dispatch, SetStateAction } from "react";
import { eventPreviewImage, locationPreviewImage } from "./images";
import type { EventItem, Filters, LocationItem, Tab, TagItem } from "./types";

type SidePanelProps = {
  activeTab: Tab;
  error?: string;
  events: EventItem[];
  filters: Filters;
  loading: boolean;
  locations: LocationItem[];
  selectedEventId?: number;
  selectedLocationId?: number;
  tags: TagItem[];
  onChangeFilters: Dispatch<SetStateAction<Filters>>;
  onRefresh: () => void;
  onSelectEvent: (id: number) => void;
  onSelectLocation: (id: number) => void;
  onSetActiveTab: (tab: Tab) => void;
};

export function SidePanel({
  activeTab,
  error,
  events,
  filters,
  loading,
  locations,
  selectedEventId,
  selectedLocationId,
  tags,
  onChangeFilters,
  onRefresh,
  onSelectEvent,
  onSelectLocation,
  onSetActiveTab,
}: SidePanelProps) {
  return (
    <aside className="side-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Chronograph SPB</p>
          <h1>Историческая карта Петербурга</h1>
        </div>
        <button
          className="icon-button"
          type="button"
          title="Обновить данные"
          aria-label="Обновить данные"
          onClick={onRefresh}
        >
          ↻
        </button>
      </header>

      <form className="filters">
        <label>
          <span>Поиск</span>
          <input
            name="q"
            type="search"
            placeholder="Событие, место, описание"
            autoComplete="off"
            value={filters.q}
            onChange={(event) =>
              onChangeFilters((current) => ({
                ...current,
                q: event.target.value,
              }))
            }
          />
        </label>
        <div className="filter-grid">
          <label>
            <span>С</span>
            <input
              name="from"
              type="text"
              inputMode="numeric"
              placeholder="1700"
              value={filters.from}
              onChange={(event) =>
                onChangeFilters((current) => ({
                  ...current,
                  from: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>По</span>
            <input
              name="to"
              type="text"
              inputMode="numeric"
              placeholder="1917"
              value={filters.to}
              onChange={(event) =>
                onChangeFilters((current) => ({
                  ...current,
                  to: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <label>
          <span>Тег</span>
          <select
            name="tag"
            value={filters.tag}
            onChange={(event) =>
              onChangeFilters((current) => ({
                ...current,
                tag: event.target.value,
              }))
            }
          >
            <option value="">Все теги</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
      </form>

      <nav className="tabs" aria-label="Разделы">
        <button
          className={activeTab === "events" ? "tab active" : "tab"}
          type="button"
          onClick={() => onSetActiveTab("events")}
        >
          События
        </button>
        <button
          className={activeTab === "locations" ? "tab active" : "tab"}
          type="button"
          onClick={() => onSetActiveTab("locations")}
        >
          Объекты
        </button>
      </nav>

      <div className="map-status">
        {error
          ? `Ошибка: ${error}`
          : loading
            ? "Обновление данных"
            : `${events.length} событий на карте`}
      </div>

      <section
        className={activeTab === "events" ? "list active" : "list"}
        aria-live="polite"
      >
        <EventsList
          events={events}
          selectedEventId={selectedEventId}
          onSelectEvent={onSelectEvent}
        />
      </section>
      <section
        className={activeTab === "locations" ? "list active" : "list"}
        aria-live="polite"
      >
        <LocationsList
          events={events}
          locations={locations}
          selectedLocationId={selectedLocationId}
          onSelectLocation={onSelectLocation}
        />
      </section>
    </aside>
  );
}

function EventsList({
  events,
  selectedEventId,
  onSelectEvent,
}: {
  events: EventItem[];
  selectedEventId?: number;
  onSelectEvent: (id: number) => void;
}) {
  if (events.length === 0) {
    return <div className="empty">События не найдены</div>;
  }

  return (
    <>
      {events.map((event) => {
        const imageUrl = eventPreviewImage(event);
        return (
          <article
            key={event.id}
            className={
              event.id === selectedEventId ? "item-card active" : "item-card"
            }
            tabIndex={0}
            onClick={() => onSelectEvent(event.id)}
            onKeyDown={(keyboardEvent) => {
              if (keyboardEvent.key === "Enter") {
                onSelectEvent(event.id);
              }
            }}
          >
            {imageUrl ? (
              <EntityImage
                className="card-image"
                src={imageUrl}
                alt={event.title}
              />
            ) : null}
            <div className="card-topline">
              <span className="date">{formatDateRange(event)}</span>
              <span className="place">
                {event.location_name || "Без объекта"}
              </span>
            </div>
            <h2>{event.title}</h2>
            <p>{event.description}</p>
            <div className="chips">
              {event.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </article>
        );
      })}
    </>
  );
}

function LocationsList({
  events,
  locations,
  selectedLocationId,
  onSelectLocation,
}: {
  events: EventItem[];
  locations: LocationItem[];
  selectedLocationId?: number;
  onSelectLocation: (id: number) => void;
}) {
  if (locations.length === 0) {
    return <div className="empty">Объекты не найдены</div>;
  }

  return (
    <>
      {locations.map((location) => {
        // Количество считается по текущему отфильтрованному набору событий, а не по всей базе.
        const count = events.filter(
          (event) => event.location_id === location.id,
        ).length;
        const imageUrl = locationPreviewImage(location);
        return (
          <article
            key={location.id}
            className={
              location.id === selectedLocationId
                ? "item-card active"
                : "item-card"
            }
            tabIndex={0}
            onClick={() => onSelectLocation(location.id)}
            onKeyDown={(keyboardEvent) => {
              if (keyboardEvent.key === "Enter") {
                onSelectLocation(location.id);
              }
            }}
          >
            {imageUrl ? (
              <EntityImage
                className="card-image"
                src={imageUrl}
                alt={location.name}
              />
            ) : null}
            <div className="card-topline">
              <span className="date">{count} событий</span>
              <span className="place">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </span>
            </div>
            <h2>{location.name}</h2>
            <p>{location.description}</p>
          </article>
        );
      })}
    </>
  );
}

function EntityImage({
  alt,
  className,
  src,
}: {
  alt: string;
  className: string;
  src: string;
}) {
  return <img className={className} src={src} alt={alt} loading="lazy" />;
}

function formatDateRange(event: EventItem): string {
  const from = event.date_from.slice(0, 4);
  const to = event.date_to?.slice(0, 4);
  if (to && to !== from) {
    return `${from}-${to}`;
  }
  return from;
}
