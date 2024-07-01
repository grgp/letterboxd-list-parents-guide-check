export type Film = {
  "film-id": string;
  "film-name": string;
  "poster-url": string;
  "film-release-year": string;
  "film-link": string;
  "parentsGuide"?: {
    "severity"?: string | null;
    "votes"?: string | null;
  };
};
