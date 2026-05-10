import type { EventItem, LocationItem } from "./types";

const eventImages: Record<number, string> = {
  1000: "https://commons.wikimedia.org/wiki/Special:FilePath/056._St._Petersburg._Mikhailovsky_Castle.jpg",
  1003: "https://commons.wikimedia.org/wiki/Special:FilePath/Kunstkamera_(Saint_Petersburg).jpg",
  1027: "https://commons.wikimedia.org/wiki/Special:FilePath/The_Mariinsky_Theatre.jpg"
};

const locationImages: Record<number, string> = {
  1000: eventImages[1000],
  1003: eventImages[1003],
  1027: eventImages[1027]
};

export function eventPreviewImage(event: EventItem): string | undefined {
  return eventImages[event.id];
}

export function locationPreviewImage(location: LocationItem): string | undefined {
  return locationImages[location.id];
}
