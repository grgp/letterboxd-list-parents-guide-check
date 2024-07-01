import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import puppeteer, { Browser } from 'puppeteer';
import { load } from 'cheerio';

import {
  FETCH_BATCH_INTERVAL,
  FETCH_BATCH_SIZE,
  NUM_OF_FILMS_TO_FETCH,
} from '../../constants';
import { Film } from '../../types/struct';

async function getParentsGuide(film: Film, browser: Browser): Promise<Film> {
  const page = await browser.newPage();
  try {
    const searchQuery = `${film['film-name']} ${film['film-release-year']} imdb Parents Guide`;
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

    console.log(`LOG: Found IMDB link: ${imdbLink}`);

    await page.goto(imdbLink);
    console.log('LOG: Navigated to IMDB page');

    const imdbContent = await page.content();
    // console.log("LOG: Loaded IMDB page content: ", imdbContent);

    const $ = load(imdbContent);

    const frighteningSection = $('#advisory-nudity');
    if (frighteningSection.length === 0) {
      console.log('LOG: Frightening section not found');
      throw new Error('Frightening section not found');
    }

    const severityContainer = frighteningSection.find(
      '.advisory-severity-vote__container'
    );
    if (severityContainer.length === 0) {
      console.log('LOG: Severity container not found');
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

    film.parentsGuide = {
      severity: severityText,
      votes: votesText,
    };

    console.log(
      `LOG: Parents Guide Content: ${JSON.stringify(film.parentsGuide)}`
    );
  } catch (error) {
    console.error(
      `Error getting Parents Guide for ${film['film-name']}:`,
      error
    );
    film.parentsGuide = {
      severity: null,
      votes: null,
    };
  } finally {
    await page.close();
  }
  return film;
}

async function processBatch(films: Film[], browser: Browser): Promise<Film[]> {
  const results = await Promise.all(
    films.map((film) => getParentsGuide(film, browser))
  );
  await new Promise((resolve) => setTimeout(resolve, FETCH_BATCH_INTERVAL));
  return results;
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
    await page.goto(listUrl);

    const htmlContent = await page.content();
    console.log('LOG: Finished loading letterboxd page');

    const $ = load(htmlContent);
    let films: Film[] = [];

    $('div[class*="poster film-poster"]').each((index, element) => {
      const film: Film = {
        'film-id': $(element).attr('data-film-id') || '',
        'film-name': $(element).attr('data-film-name') || '',
        'poster-url': $(element).attr('data-poster-url') || '',
        'film-release-year': $(element).attr('data-film-release-year') || '',
        'film-link': $(element).attr('data-film-link') || '',
        parentsGuide: {},
      };
      films.push(film);
    });

    const filmsToProcess = films.slice(0, NUM_OF_FILMS_TO_FETCH);

    const batchSize = FETCH_BATCH_SIZE;
    let processedFilms: Film[] = [];

    for (let i = 0; i < filmsToProcess.length; i += batchSize) {
      const batch = filmsToProcess.slice(i, i + batchSize);
      console.log(`LOG: Processing batch ${i / batchSize + 1}`);
      const batchResults = await processBatch(batch, browser);
      processedFilms = [...processedFilms, ...batchResults];
    }

    await browser.close();

    console.log('LOG: Finished scraping films');
    console.log('LOG: Films scraped: ', processedFilms);

    return NextResponse.json({ films: processedFilms });
  } catch (error) {
    console.error('Error scraping films:', error);
    return NextResponse.json(
      { message: 'Error scraping films' },
      { status: 500 }
    );
  }
}
