export type FilmDbRecord = {
  letterboxd_film_id: string;
  film_name: string;
  poster_url: string;
  film_release_year: string;
  film_link: string;
  parents_guide_severity: string | null;
  parents_guide_votes: string | null;
};

export function filmToDbRecord(film: FilmDbRecord): FilmDbRecord {
  return {
    letterboxd_film_id: film.letterboxd_film_id,
    film_name: film.film_name,
    poster_url: film.poster_url,
    film_release_year: film.film_release_year,
    film_link: film.film_link,
    parents_guide_severity: film.parents_guide_severity || null,
    parents_guide_votes: film.parents_guide_votes || null,
  };
}

export function insertFilmQuery(film: FilmDbRecord): {
  sql: string;
  params: (string | null)[];
} {
  const fields = Object.keys(film);
  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT OR IGNORE INTO films (${fields.join(
    ', '
  )}) VALUES (${placeholders})`;
  const params = Object.values(film);

  return { sql, params };
}

// New helper function for update query
export function updateFilmQuery(
  film: Record<string, string> /* Partial<FilmDbRecord> */
): {
  sql: string;
  params: (string | null)[];
} {
  const fields = ['film_name', 'poster_url', 'film_release_year', 'film_link'];
  const updateFields = fields.map((field) => `${field} = ?`).join(', ');
  const sql = `UPDATE films SET ${updateFields} WHERE letterboxd_film_id = ?`;
  const params = [
    ...fields.map((field) => film[field] ?? null),
    film.letterboxd_film_id,
  ];

  return { sql, params };
}
