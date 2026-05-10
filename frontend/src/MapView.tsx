import maplibregl, { GeoJSONSource, Map, Marker, Popup } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { EventItem, GeoJSONFeatureCollection, LocationItem } from "./types";

type MapViewProps = {
  events: EventItem[];
  geoJSON: GeoJSONFeatureCollection;
  locations: LocationItem[];
  selectedEvent?: EventItem;
  selectedLocation?: LocationItem;
  onSelectEvent: (id: number) => void;
  onSelectLocation: (id: number) => void;
};

export function MapView({
  events,
  geoJSON,
  locations,
  selectedEvent,
  selectedLocation,
  onSelectEvent,
  onSelectLocation
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const popupRef = useRef<Popup | null>(null);
  const selectEventRef = useRef(onSelectEvent);
  const selectLocationRef = useRef(onSelectLocation);

  useEffect(() => {
    selectEventRef.current = onSelectEvent;
  }, [onSelectEvent]);

  useEffect(() => {
    selectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [30.3141, 59.9386],
      zoom: 11.2,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors"
          }
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm"
          }
        ]
      }
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left");

    map.on("load", () => {
      map.addSource("events", {
        type: "geojson",
        data: geoJSON
      });

      map.addLayer({
        id: "event-points",
        type: "circle",
        source: "events",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 6, 14, 10],
          "circle-color": "#c2410c",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff"
        }
      });

      map.addLayer({
        id: "selected-event-point",
        type: "circle",
        source: "events",
        filter: ["==", ["get", "id"], -1],
        paint: {
          "circle-radius": 17,
          "circle-color": "#facc15",
          "circle-opacity": 0.82,
          "circle-stroke-width": 4,
          "circle-stroke-color": "#7c2d12"
        }
      });

      map.on("click", "event-points", (event) => {
        const feature = event.features?.[0];
        const id = Number(feature?.properties?.id);
        if (id) {
          selectEventRef.current(id);
        }
      });

      map.on("mouseenter", "event-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "event-points", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const updateSource = () => {
      const source = map.getSource("events") as GeoJSONSource | undefined;
      source?.setData(geoJSON);
    };

    if (map.loaded()) {
      updateSource();
    } else {
      map.once("load", updateSource);
    }
  }, [geoJSON]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    const highlightedLocationId = selectedEvent?.location_id ?? selectedLocation?.id;
    markersRef.current = locations.map((location) => {
      const markerNode = document.createElement("button");
      markerNode.className = location.id === highlightedLocationId ? "location-marker active" : "location-marker";
      markerNode.type = "button";
      markerNode.title = location.name;
      markerNode.addEventListener("click", () => selectLocationRef.current(location.id));

      return new maplibregl.Marker({ element: markerNode, anchor: "center" })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map);
    });
  }, [locations, selectedEvent?.location_id, selectedLocation?.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const updateSelectedLayer = () => {
      if (!map.getLayer("selected-event-point")) {
        return;
      }
      map.setFilter("selected-event-point", ["==", ["get", "id"], selectedEvent?.id ?? -1]);
    };

    if (map.loaded()) {
      updateSelectedLayer();
    } else {
      map.once("load", updateSelectedLayer);
    }
  }, [selectedEvent?.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || events.length === 0) {
      return;
    }

    const points = events.filter((event) => event.longitude !== undefined && event.latitude !== undefined);
    if (points.length === 0) {
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    points.forEach((event) => bounds.extend([event.longitude as number, event.latitude as number]));
    map.fitBounds(bounds, { padding: 70, maxZoom: 13.5, duration: 600 });
  }, [events]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (selectedEvent?.longitude !== undefined && selectedEvent.latitude !== undefined) {
      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({ closeButton: false, offset: 24 })
        .setLngLat([selectedEvent.longitude, selectedEvent.latitude])
        .setHTML(`<strong>${escapeHTML(selectedEvent.title)}</strong><span>${escapeHTML(selectedEvent.location_name || "")}</span>`)
        .addTo(map);
      map.flyTo({ center: [selectedEvent.longitude, selectedEvent.latitude], zoom: 14, essential: true });
      return;
    }

    if (selectedLocation) {
      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({ closeButton: false, offset: 24 })
        .setLngLat([selectedLocation.longitude, selectedLocation.latitude])
        .setHTML(`<strong>${escapeHTML(selectedLocation.name)}</strong><span>Объект</span>`)
        .addTo(map);
      map.flyTo({ center: [selectedLocation.longitude, selectedLocation.latitude], zoom: 14, essential: true });
      return;
    }

    popupRef.current?.remove();
  }, [selectedEvent, selectedLocation]);

  return (
    <section className="map-panel">
      <div ref={containerRef} className="map" />
    </section>
  );
}

function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char];
  });
}
