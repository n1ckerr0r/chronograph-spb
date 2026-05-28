import type {
  EventItem,
  GeoJSONFeatureCollection,
  LocationItem,
  MediaItem,
  TagItem,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

// Загружает список тегов для фильтра в боковой панели.
export async function fetchTags(): Promise<TagItem[]> {
  return fetchJSON<TagItem[]>("/api/tags");
}

// Загружает все объекты карты: здания, площади, мосты, музеи и другие места.
export async function fetchLocations(): Promise<LocationItem[]> {
  return fetchJSON<LocationItem[]>("/api/locations");
}

// Загружает события с учетом текущих фильтров: поиск, период, тег и лимит.
export async function fetchEvents(
  query: URLSearchParams,
): Promise<EventItem[]> {
  return fetchJSON<EventItem[]>(`/api/events?${query}`);
}

// Загружает те же события в формате GeoJSON, чтобы MapLibre мог отрисовать точки на карте.
export async function fetchEventsGeoJSON(
  query: URLSearchParams,
): Promise<GeoJSONFeatureCollection> {
  return fetchJSON<GeoJSONFeatureCollection>(
    `/api/map/events.geojson?${query}`,
  );
}

// Загружает media выбранного события для подробной карточки.
export async function fetchEventMedia(eventId: number): Promise<MediaItem[]> {
  return fetchJSON<MediaItem[]>(`/api/events/${eventId}/media`);
}

// Общий helper для JSON-запросов к backend API с единым форматом ошибок.
async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status}: ${body}`);
  }
  return response.json() as Promise<T>;
}
