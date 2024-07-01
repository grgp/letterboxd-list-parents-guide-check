"use client";
import React, { useState } from 'react';

export const LetterboxdListPage = () => {
  const [films, setFilms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleScrape = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scrapeFilms', { method: 'POST' });
      const data = await response.json();
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
            <li key={index}>{film}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LetterboxdListPage;
