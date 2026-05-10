import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchEventMedia, fetchEvents, fetchEventsGeoJSON, fetchLocations, fetchTags } from "./api";
import { MapView } from "./MapView";
import { SidePanel } from "./SidePanel";
import type { EventItem, Filters, GeoJSONFeatureCollection, LocationItem, MediaItem, Tab, TagItem } from "./types";

const initialFilters: Filters = {
  q: "",
  from: "1700",
  to: "2026",
  tag: ""
};

const emptyGeoJSON: GeoJSONFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

export function App() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [geoJSON, setGeoJSON] = useState<GeoJSONFeatureCollection>(emptyGeoJSON);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [activeTab, setActiveTab] = useState<Tab>("events");
  const [selectedEventId, setSelectedEventId] = useState<number>();
  const [selectedLocationId, setSelectedLocationId] = useState<number>();
  const [selectedEventMedia, setSelectedEventMedia] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId]
  );

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === selectedLocationId),
    [locations, selectedLocationId]
  );

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) {
        params.set(key, value.trim());
      }
    });
    params.set("limit", "500");
    return params;
  }, [filters]);

  const loadDictionaryData = useCallback(async () => {
    const [nextTags, nextLocations] = await Promise.all([fetchTags(), fetchLocations()]);
    setTags(nextTags);
    setLocations(nextLocations);
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [nextEvents, nextGeoJSON] = await Promise.all([fetchEvents(query), fetchEventsGeoJSON(query)]);
      setEvents(nextEvents);
      setGeoJSON(nextGeoJSON);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      await loadDictionaryData();
      const [nextEvents, nextGeoJSON] = await Promise.all([fetchEvents(query), fetchEventsGeoJSON(query)]);
      setEvents(nextEvents);
      setGeoJSON(nextGeoJSON);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }, [loadDictionaryData, query]);

  useEffect(() => {
    loadDictionaryData().catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Неизвестная ошибка");
    });
  }, [loadDictionaryData]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadEvents(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadEvents]);

  useEffect(() => {
    if (!selectedEventId) {
      setSelectedEventMedia([]);
      return;
    }

    let isActive = true;
    setMediaLoading(true);
    fetchEventMedia(selectedEventId)
      .then((items) => {
        if (isActive) {
          setSelectedEventMedia(items);
        }
      })
      .catch(() => {
        if (isActive) {
          setSelectedEventMedia([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setMediaLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedEventId]);

  const selectEvent = useCallback(
    (id: number) => {
      const event = events.find((item) => item.id === id);
      setSelectedEventId(id);
      setSelectedLocationId(event?.location_id);
    },
    [events]
  );

  const selectLocation = useCallback((id: number) => {
    setSelectedLocationId(id);
    setSelectedEventId(undefined);
  }, []);

  return (
    <main className="shell">
      <MapView
        events={events}
        geoJSON={geoJSON}
        locations={locations}
        selectedEvent={selectedEvent}
        selectedLocation={selectedLocation}
        onSelectEvent={selectEvent}
        onSelectLocation={selectLocation}
      />
      <SidePanel
        activeTab={activeTab}
        error={error}
        events={events}
        filters={filters}
        loading={loading}
        locations={locations}
        mediaLoading={mediaLoading}
        selectedEventId={selectedEventId}
        selectedEvent={selectedEvent}
        selectedEventMedia={selectedEventMedia}
        selectedLocationId={selectedLocationId}
        selectedLocation={selectedLocation}
        tags={tags}
        onChangeFilters={setFilters}
        onRefresh={() => void reloadAll()}
        onSelectEvent={selectEvent}
        onSelectLocation={selectLocation}
        onSetActiveTab={setActiveTab}
      />
    </main>
  );
}
