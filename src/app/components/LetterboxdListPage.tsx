'use client';

import React, { useState } from 'react';
import Chip from '@mui/joy/Chip/Chip';
import Stack from '@mui/joy/Stack/Stack';
import Input from '@mui/joy/Input/Input';
import Button from '@mui/joy/Button/Button';

import { Film } from '../types/struct';
import Typography from '@mui/joy/Typography/Typography';

const DEFAULT_LIST_URL =
  'https://letterboxd.com/grgp/list/to-watch-3-w-descriptions/';

const SEVERITY_CHIPS_MAP: Record<string, JSX.Element> = {
  None: (
    <Chip variant="solid" color="success">
      None
    </Chip>
  ),
  Mild: (
    <Chip variant="solid" color="primary">
      Mild
    </Chip>
  ),
  Moderate: (
    <Chip variant="solid" color="warning">
      Moderate
    </Chip>
  ),
  Severe: (
    <Chip variant="solid" color="danger">
      Severe
    </Chip>
  ),
};

export const LetterboxdListPage = () => {
  const [listUrl, setListUrl] = useState<string>(DEFAULT_LIST_URL);
  const [films, setFilms] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleScrape = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scrapeFilms', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listUrl }),
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
    <Stack padding={8} spacing={4}>
      <Typography level="h2">
        Is your Letterboxd list safe to watch in the living room
      </Typography>
      <Input
        placeholder="Type in here…"
        value={listUrl}
        onChange={(e) => setListUrl(e.target.value)}
      />
      <Button onClick={handleScrape} disabled={isLoading}>
        {isLoading ? 'Scraping...' : 'Scrape Films'}
      </Button>{' '}
      <Stack direction="row" spacing={2}>
        <Chip variant="solid" color="success">
          None
        </Chip>
        <Chip variant="solid" color="primary">
          Mild
        </Chip>
        <Chip variant="solid" color="warning">
          Moderate
        </Chip>
        <Chip variant="solid" color="danger">
          Severe
        </Chip>
      </Stack>
      {films.length > 0 && (
        <ol>
          {films.map((film, index) => {
            const severity = film['parentsGuide']['severity'] || 'None';

            return (
              <li key={index}>
                {index}. {film['film-name']} ({film['film-release-year']}) --{' '}
                {SEVERITY_CHIPS_MAP[severity]}
                {` (${film.parentsGuide.votes})`}
              </li>
            );
          })}
        </ol>
      )}
    </Stack>
  );
};

export default LetterboxdListPage;
