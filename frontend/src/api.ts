import type { EventItem, GeoJSONFeatureCollection, LocationItem, MediaItem, TagItem } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export async function fetchTags(): Promise<TagItem[]> {
  return fetchJSON<TagItem[]>("/api/tags");
}

export async function fetchLocations(): Promise<LocationItem[]> {
  return fetchJSON<LocationItem[]>("/api/locations");
}

export async function fetchEvents(query: URLSearchParams): Promise<EventItem[]> {
  return fetchJSON<EventItem[]>(`/api/events?${query}`);
}

export async function fetchEventsGeoJSON(query: URLSearchParams): Promise<GeoJSONFeatureCollection> {
  return fetchJSON<GeoJSONFeatureCollection>(`/api/map/events.geojson?${query}`);
}

export async function fetchEventMedia(eventId: number): Promise<MediaItem[]> {
  return fetchJSON<MediaItem[]>(`/api/events/${eventId}/media`);
}

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status}: ${body}`);
  }
  return response.json() as Promise<T>;
}
