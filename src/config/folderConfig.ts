export const ZONES = [
  { id: "zoneofinterest1", label: "Ecology" },
  { id: "zoneofinterest2", label: "Governance" },
  { id: "zoneofinterest3", label: "Economy" },
  { id: "zoneofinterest4", label: "Infrastructure" },
  { id: "zoneofinterest5", label: "Culture" },
  { id: "zoneofinterest6", label: "Social" },
  { id: "zoneofinterest7", label: "Technology" },
] as const;

export const INTIMACY_LEVELS = [
  { id: "intimacylevel1", label: "Personal / Intimate" },
  { id: "intimacylevel2", label: "Social / Communal" },
  { id: "intimacylevel3", label: "Global / Civilisational" },
] as const;

export type ZoneId = (typeof ZONES)[number]["id"];
export type IntimacyId = (typeof INTIMACY_LEVELS)[number]["id"];

export interface FolderConfig {
  folder: string;
  galleryType: "standard" | "diagram";
}

export const folderConfig: Record<string, FolderConfig> = {
  utopias: {
    folder: "utopias",
    galleryType: "standard",
  },
  gefion: {
    folder: "gefion",
    galleryType: "diagram",
  },
  next: {
    folder: "next",
    galleryType: "diagram",
  },
};
