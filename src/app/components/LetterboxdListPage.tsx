'use client';

import React, { useState } from 'react';
import Chip from '@mui/joy/Chip/Chip';
import Stack from '@mui/joy/Stack/Stack';
import Input from '@mui/joy/Input/Input';
import Button from '@mui/joy/Button/Button';

import { Film } from '../types/struct';
import Typography from '@mui/joy/Typography/Typography';
import List from '@mui/joy/List/List';
import ListItem from '@mui/joy/ListItem/ListItem';
import Table from '@mui/joy/Table/Table';

const DEFAULT_LIST_URL =
  'https://letterboxd.com/grgp/list/to-watch-3-w-descriptions/';

const SEVERITY_CHIPS_MAP: Record<string, JSX.Element> = {
  'NoData': (
    <Chip variant="solid">
      No Data
    </Chip>
  ),
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
      <Table aria-label="basic table" bgcolor="white">
        <thead>
          <tr>
            <th>Film</th>
            <th>Severity</th>
            <th>Votes</th>
          </tr>
        </thead>
        <tbody>
          {films.map((film, index) => {
            const severity = film['parentsGuide']['severity'];

            return (
              <tr key={index}>
                <td>
                  {film['film-name']} ({film['film-release-year']})
                </td>
                <td>{severity ? SEVERITY_CHIPS_MAP[severity] : 'Not found'}</td>
                <td>{severity ? film.parentsGuide.votes : 'Not found'}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Stack>
  );
};

export default LetterboxdListPage;
