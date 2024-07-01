'use client';

import React, { useState } from 'react';
import { Film } from '../types/struct';

export const LetterboxdListPage = () => {
  const [films, setFilms] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleScrape = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scrapeFilms', {
        method: 'POST',
      });

      const data = (await response.json()) as { films: Film[] };

      setFilms(data.films);
    } catch (error) {
      console.error('Error fetching films:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleScrape} disabled={isLoading}>
        {isLoading ? 'Scraping...' : 'Scrape Films'}
      </button>
      {films.length > 0 && (
        <ul>
          {films.map((film, index) => (
            <li key={index}>{film['film-name']} --- {film['film-release-year']}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LetterboxdListPage;
