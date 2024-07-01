/*
  <div
    class="react-component poster film-poster film-poster-39131 linked-film-poster"
    data-component-class="globals.comps.FilmPosterComponent"
    data-film-id="39131"
    data-film-name="Divorce Italian Style"
    data-film-slug="divorce-italian-style"
    data-poster-url="/film/divorce-italian-style/image-150/"
    data-film-release-year="1961"
    data-new-list-with-film-action="/list/new/with/divorce-italian-style/"
    data-remove-from-watchlist-action="/film/divorce-italian-style/remove-from-watchlist/"
    data-add-to-watchlist-action="/film/divorce-italian-style/add-to-watchlist/"
    data-rate-action="/film/divorce-italian-style/rate/"
    data-mark-as-watched-action="/film/divorce-italian-style/mark-as-watched/"
    data-mark-as-not-watched-action="/film/divorce-italian-style/mark-as-not-watched/"
    data-film-link="/film/divorce-italian-style/"
  >
*/

import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
import cheerio from 'cheerio';

type Film = {
  'film-id': string;
  'film-name': string;
  'poster-url': string;
  'film-release-year': string;
  'film-link': string;
}

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  console.log('Request:', req);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    console.log('Request:', req);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://letterboxd.com/grgp/list/to-watch-3-w-descriptions/');
    const htmlContent = await page.content();

    console.log('Content:', htmlContent);

    const $ = cheerio.load(htmlContent);
    const films: string[] = [];

    console.log('Films:', films);

    await browser.close();

    res.status(200).json({ films });
  } catch (error) {
    console.error('Error scraping films:', error);
    res.status(500).json({ message: 'Error scraping films' });
  }
}
