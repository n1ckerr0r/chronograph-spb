export type EventItem = {
  id: number;
  title: string;
  description: string;
  date_from: string;
  date_to?: string;
  location_id?: number;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  tags: string[];
};

export type LocationItem = {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
};

export type TagItem = {
  id: number;
  name: string;
};

export type MediaItem = {
  id: number;
  event_id: number;
  url: string;
  caption: string;
  type: string;
};

export type GeoJSONFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  Record<string, unknown>
>;

export type Tab = "events" | "locations";

export type Filters = {
  q: string;
  from: string;
  to: string;
  tag: string;
};
