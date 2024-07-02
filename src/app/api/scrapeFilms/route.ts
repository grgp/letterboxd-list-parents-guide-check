import { NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import puppeteer, { Browser, Page } from 'puppeteer';
import { load } from 'cheerio';

import {
  FETCH_BATCH_INTERVAL,
  FETCH_BATCH_SIZE,
  NUM_OF_FILMS_TO_FETCH,
} from '../../constants';
import { getDb } from '../../lib/db';
import {
  FilmDbRecord,
  filmToDbRecord,
  insertFilmQuery,
  updateFilmQuery,
} from '../../lib/dbHelpers';

async function getParentsGuide(
  film: FilmDbRecord,
  browser: Browser
): Promise<FilmDbRecord> {
  const page = await browser.newPage();
  try {
    const searchQuery = `${film['film_name']} ${film.film_release_year} imdb Parents Guide`;
    await page.goto(
      `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
    );

    const searchContent = await page.content();
    const $search = load(searchContent);

    const imdbLink = $search('div.g')
      .map((_, el) => {
        const link = $search(el).find('a').attr('href');
        return link &&
          link.includes('imdb.com') &&
          link.includes('parentalguide')
          ? link
          : null;
      })
      .get()
      .find((link) => link !== null);

    if (!imdbLink) {
      throw new Error('IMDB Parents Guide page not found');
    }

    console.log(`LOG-${film['film_name']}: Found IMDB link for: ${imdbLink}`);

    await page.goto(imdbLink);
    // console.log('LOG: Navigated to IMDB page');

    const imdbContent = await page.content();
    // console.log("LOG: Loaded IMDB page content: ", imdbContent);

    const $ = load(imdbContent);

    const frighteningSection = $('#advisory-nudity');
    if (frighteningSection.length === 0) {
      console.log(`LOG-${film['film_name']}: N section not found`);
      throw new Error('N section not found');
    }

    const severityContainer = frighteningSection.find(
      '.advisory-severity-vote__container'
    );
    if (severityContainer.length === 0) {
      console.log(`LOG-${film['film_name']}: Severity container not found`);
      throw new Error('Severity container not found');
    }

    const severitySpan = severityContainer.find('span.ipl-status-pill');
    const severityAnchor = severityContainer.find(
      'a.advisory-severity-vote__message'
    );

    let severityText = severitySpan.text().trim() || 'None';
    const votesText = severityAnchor.text().trim();
    if (!votesText && severityText === 'None') {
      severityText = 'NoData';
    }

    film.parents_guide_severity = severityText;
    film.parents_guide_votes = votesText;

    console.log(
      `LOG: Parents Guide Content ${film['film_name']}: ${JSON.stringify({
        severityText,
        votesText,
      })}`
    );
  } catch (error) {
    console.error(`Error getting Parents Guide for ${film['film_name']}:`);
    film.parents_guide_severity = null;
    film.parents_guide_votes = null;
  } finally {
    await page.close();
  }
  return film;
}

async function dummyProcessBatch(
  films: FilmDbRecord[],
  browser: Browser
): Promise<FilmDbRecord[]> {
  return films;
}

async function fetchAndSaveParentsGuide(
  films: FilmDbRecord[],
  browser: Browser
): Promise<FilmDbRecord[]> {
  const db = await getDb();

  // Separate films that need parents guide fetching and those that don't
  const [filmsToFetch, filmsToNotFetch] = await Promise.all([
    Promise.all(
      films.filter(async (film) => {
        const existingFilm = await db.get(
          'SELECT * FROM films WHERE letterboxd_film_id = ?',
          film.letterboxd_film_id
        );
        return !existingFilm;
      })
    ),
    Promise.all(
      films.filter(async (film) => {
        const existingFilm = await db.get(
          'SELECT * FROM films WHERE letterboxd_film_id = ?',
          film.letterboxd_film_id
        );
        return !!existingFilm;
      })
    ),
  ]);

  // Fetch parents guide for new films
  const filmsWithParentsGuide = await Promise.all(
    filmsToFetch.map((film) => getParentsGuide(film, browser))
  );

  // Insert new films
  for (const film of filmsWithParentsGuide) {
    const dbRecord = filmToDbRecord(film);
    const { sql, params } = insertFilmQuery(dbRecord);
    await db.run(sql, params);
  }

  // Update existing films
  for (const film of filmsToNotFetch) {
    const { sql, params } = updateFilmQuery(film);
    await db.run(sql, params);
  }

  // Combine all films
  const updatedFilms = [...filmsWithParentsGuide, ...filmsToNotFetch];

  return updatedFilms;
}

async function processBatch(
  films: FilmDbRecord[],
  browser: Browser
): Promise<FilmDbRecord[]> {
  const db = await getDb();

  await fetchAndSaveParentsGuide(films, browser);

  // Get all films (including those that were already in the database)
  const allFilms = await Promise.all(
    films.map(async (film) => {
      const dbFilm = await db.get(
        'SELECT * FROM films WHERE letterboxd_film_id = ?',
        film.letterboxd_film_id
      );

      return {
        ...dbFilm,
        parentsGuide: {
          severity: dbFilm.parents_guide_severity,
          votes: dbFilm.parents_guide_votes,
        },
      };
    })
  );

  await new Promise((resolve) => setTimeout(resolve, FETCH_BATCH_INTERVAL));
  return allFilms;
}

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

export async function POST(req: any, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const reqJson = await req.json();
    const listUrl = reqJson.listUrl;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(listUrl, { waitUntil: 'networkidle0' });

    console.log('LOG: Starting to scroll through the page');
    await autoScroll(page);
    console.log('LOG: Finished scrolling through the page');

    // Wait for a short time to ensure all lazy-loaded content is rendered
    new Promise((resolve) => setTimeout(resolve, 2000));

    const htmlContent = await page.content();
    console.log('LOG: Finished loading letterboxd page');

    const $ = load(htmlContent);
    let films: FilmDbRecord[] = [];

    $('div[class*="film-poster"]').each((index, element) => {
      let filmName = $(element).attr('data-film-name');

      if (!filmName) {
        filmName = $(element).attr('data-film-slug')?.split('-').join(' ');
      }

      if (filmName) {
        const film: FilmDbRecord = {
          letterboxd_film_id: $(element).attr('data-film-id') || '',
          film_name: filmName || '',
          poster_url: $(element).attr('data-poster-url') || '',
          film_release_year: $(element).attr('data-film-release-year') || '',
          film_link: $(element).attr('data-film-link') || '',
          parents_guide_severity: null,
          parents_guide_votes: null,
        };

        films.push(film);
      }
    });

    console.log(`LOG: Scraped ${films.length} films`);

    await browser.close();
    console.log('LOG: Films scraped: ', films);

    const filmsToProcess = films.slice(0, NUM_OF_FILMS_TO_FETCH);

    const batchSize = FETCH_BATCH_SIZE;
    let processedFilms: FilmDbRecord[] = [];

    for (let i = 0; i < filmsToProcess.length; i += batchSize) {
      const batch = filmsToProcess.slice(i, i + batchSize);
      console.log(`LOG: Processing batch ${i / batchSize + 1}`);
      const batchResults = await processBatch(batch, browser);
      processedFilms = [...processedFilms, ...batchResults];
    }

    await browser.close();

    console.log('LOG: Finished scraping films: ' + processedFilms.length);

    return NextResponse.json({ films: processedFilms });
  } catch (error) {
    console.error('Error scraping films:', error);
    return NextResponse.json(
      { message: 'Error scraping films' },
      { status: 500 }
    );
  }
}
