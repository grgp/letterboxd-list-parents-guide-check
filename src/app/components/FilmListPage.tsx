'use client';

import { useState } from 'react';

export default function FilmListPage() {
  const [films, setFilms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLetterboxdList = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/getLetterboxdList');
      const data = await response.json();
      setFilms(data.films);
    } catch (error) {
      console.error('Error fetching Letterboxd list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchLetterboxdList} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Fetch Letterboxd List'}
      </button>
      {films.length > 0 && (
        <ul>
          {films.map((film, index) => (
            <li key={index}>{film.title}</li>
          ))}
        </ul>
      )}
      <p>End of list.</p>
    </div>
  );
}
