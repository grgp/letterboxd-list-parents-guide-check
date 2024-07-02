import { Film } from '../types/struct';

type FilmDbRecord = {
  letterboxd_film_id: string;
  film_name: string;
  poster_url: string;
  film_release_year: string;
  film_link: string;
  parents_guide_severity: string | null;
  parents_guide_votes: string | null;
};

export function filmToDbRecord(film: Film): FilmDbRecord {
  return {
    letterboxd_film_id: film['letterboxd-film-id'],
    film_name: film['film-name'],
    poster_url: film['poster-url'],
    film_release_year: film['film-release-year'],
    film_link: film['film-link'],
    parents_guide_severity: film.parentsGuide.severity || null,
    parents_guide_votes: film.parentsGuide.votes || null,
  };
}

export function insertFilmQuery(film: FilmDbRecord): {
  sql: string;
  params: (string | null)[];
} {
  const fields = Object.keys(film);
  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO films (${fields.join(
    ', '
  )}) VALUES (${placeholders})`;
  const params = Object.values(film);

  return { sql, params };
}
