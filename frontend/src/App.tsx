import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchEventMedia,
  fetchEvents,
  fetchEventsGeoJSON,
  fetchLocations,
  fetchTags,
} from "./api";
import { MapView } from "./MapView";
import { SidePanel } from "./SidePanel";
import type {
  EventItem,
  Filters,
  GeoJSONFeatureCollection,
  LocationItem,
  MediaItem,
  Tab,
  TagItem,
} from "./types";

const initialFilters: Filters = {
  q: "",
  from: "1700",
  to: "2026",
  tag: "",
};

const emptyGeoJSON: GeoJSONFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export function App() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [geoJSON, setGeoJSON] =
    useState<GeoJSONFeatureCollection>(emptyGeoJSON);
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
    [events, selectedEventId],
  );

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === selectedLocationId),
    [locations, selectedLocationId],
  );

  const visibleLocations = useMemo(() => {
    const search = filters.q.trim().toLowerCase();
    if (!search) {
      return locations;
    }

    const eventLocationIds = new Set(
      events
        .map((event) => event.location_id)
        .filter((id): id is number => id !== undefined),
    );
    return locations.filter((location) => {
      const locationText =
        `${location.name} ${location.description}`.toLowerCase();
      return locationText.includes(search) || eventLocationIds.has(location.id);
    });
  }, [events, filters.q, locations]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) {
        params.set(key, value.trim());
      }
    });
    // Backend поддерживает limit; UI запрашивает запас, чтобы показать весь текущий seed-набор.
    params.set("limit", "500");
    return params;
  }, [filters]);

  // Справочники меняются редко, поэтому грузим их отдельно и не обновляем при каждом изменении фильтра.
  const loadDictionaryData = useCallback(async () => {
    const [nextTags, nextLocations] = await Promise.all([
      fetchTags(),
      fetchLocations(),
    ]);
    setTags(nextTags);
    setLocations(nextLocations);
  }, []);

  // Список событий и GeoJSON обновляются вместе, чтобы боковая панель и карта не расходились.
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [nextEvents, nextGeoJSON] = await Promise.all([
        fetchEvents(query),
        fetchEventsGeoJSON(query),
      ]);
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
      const [nextEvents, nextGeoJSON] = await Promise.all([
        fetchEvents(query),
        fetchEventsGeoJSON(query),
      ]);
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
    // Debounce снижает количество запросов во время набора текста в поиске.
    const timeout = window.setTimeout(() => void loadEvents(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadEvents]);

  useEffect(() => {
    if (!selectedEventId) {
      setSelectedEventMedia([]);
      return;
    }

    // Старый запрос media не должен перезаписать данные после выбора другого события.
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
    [events],
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
        locations={visibleLocations}
        mediaLoading={mediaLoading}
        selectedEvent={selectedEvent}
        selectedEventMedia={selectedEventMedia}
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
        locations={visibleLocations}
        selectedEventId={selectedEventId}
        selectedLocationId={selectedLocationId}
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
