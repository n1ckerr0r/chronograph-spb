import { eventPreviewImage, locationPreviewImage } from "./images";
import {
  eventHistoricalContext,
  locationHistoricalContext,
} from "./historicalContext";
import type { EventItem, LocationItem, MediaItem } from "./types";

type SelectionCardProps = {
  media: MediaItem[];
  mediaLoading: boolean;
  selectedEvent?: EventItem;
  selectedLocation?: LocationItem;
};

export function SelectionCard({
  media,
  mediaLoading,
  selectedEvent,
  selectedLocation,
}: SelectionCardProps) {
  if (!selectedEvent && !selectedLocation) {
    return null;
  }

  if (selectedEvent) {
    // Media может быть ссылкой или картинкой; detail-карточка отделяет первое изображение от остальных ссылок.
    const image = media.find(
      (item) =>
        item.type === "image" ||
        /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(item.url),
    );
    const links = media.filter((item) => item.id !== image?.id);
    const imageUrl = image?.url ?? eventPreviewImage(selectedEvent);
    const context = eventHistoricalContext(selectedEvent);

    return (
      <section className="selection-card" aria-live="polite">
        {imageUrl ? (
          <EntityImage
            className="selection-image"
            src={imageUrl}
            alt={image?.caption || selectedEvent.title}
          />
        ) : null}
        <div className="selection-body">
          <div className="card-topline">
            <span className="date">{formatDateRange(selectedEvent)}</span>
            <span className="place">
              {selectedEvent.location_name || "Без объекта"}
            </span>
          </div>
          <h2>{selectedEvent.title}</h2>
          <p>{selectedEvent.description}</p>
          <div className="chips">
            {selectedEvent.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <ContextBlock text={context} />
          {mediaLoading ? <p className="media-note">Загрузка media</p> : null}
          {links.length > 0 ? (
            <div className="media-links">
              {links.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.caption || item.url}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const imageUrl = selectedLocation
    ? locationPreviewImage(selectedLocation)
    : undefined;
  const context = selectedLocation
    ? locationHistoricalContext(selectedLocation)
    : "";

  return (
    <section className="selection-card compact" aria-live="polite">
      {selectedLocation && imageUrl ? (
        <EntityImage
          className="selection-image"
          src={imageUrl}
          alt={selectedLocation.name}
        />
      ) : null}
      <div className="selection-body">
        <div className="card-topline">
          <span className="date">Объект</span>
          <span className="place">
            {selectedLocation?.latitude.toFixed(4)},{" "}
            {selectedLocation?.longitude.toFixed(4)}
          </span>
        </div>
        <h2>{selectedLocation?.name}</h2>
        <p>{selectedLocation?.description}</p>
        <ContextBlock text={context} />
      </div>
    </section>
  );
}

function ContextBlock({ text }: { text: string }) {
  return (
    <div className="context-block">
      <span>Исторический контекст</span>
      <p>{text}</p>
    </div>
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
