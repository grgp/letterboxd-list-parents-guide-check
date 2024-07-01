import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import puppeteer, { Browser } from "puppeteer";
import { load } from "cheerio";
import { Film } from "../../types/struct";

async function getParentsGuide(film: Film, browser: Browser): Promise<Film> {
  const page = await browser.newPage();
  try {
    const searchQuery = `${film["film-name"]} ${film["film-release-year"]} imdb Parents Guide`;
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
    
    const searchContent = await page.content();
    const $search = load(searchContent);
    
    const imdbLink = $search('div.g').map((_, el) => {
      const link = $search(el).find('a').attr('href');
      return link && link.includes('imdb.com') && link.includes('parentalguide') ? link : null;
    }).get().find(link => link !== null);

    if (!imdbLink) {
      throw new Error('IMDB Parents Guide page not found');
    }

    console.log(`LOG: Found IMDB link: ${imdbLink}`);

    await page.goto(imdbLink);
    console.log("LOG: Navigated to IMDB page");

    const imdbContent = await page.content();
    // console.log("LOG: Loaded IMDB page content: ", imdbContent);

    const $ = load(imdbContent);

    const frighteningSection = $('#advisory-frightening');
    if (frighteningSection.length === 0) {
      console.log("LOG: Frightening section not found");
      throw new Error('Frightening section not found');
    }

    const severityContainer = frighteningSection.find('.advisory-severity-vote__container');
    if (severityContainer.length === 0) {
      console.log("LOG: Severity container not found");
      throw new Error('Severity container not found');
    }

    const severitySpan = severityContainer.find('span.ipl-status-pill');
    const severityAnchor = severityContainer.find('a.advisory-severity-vote__message');

    film.parentsGuide = {
      severity: severitySpan.text().trim() || 'Not found',
      votes: severityAnchor.text().trim() || 'Not found'
    };

    console.log(`LOG: Parents Guide Content: ${JSON.stringify(film.parentsGuide)}`);

  } catch (error) {
    console.error(`Error getting Parents Guide for ${film["film-name"]}:`, error);
    film.parentsGuide = {
      severity: 'Error: Unable to retrieve',
      votes: 'Error: Unable to retrieve'
    };
  } finally {
    await page.close();
  }
  return film;
}

async function processBatch(films: Film[], browser: Browser): Promise<Film[]> {
  const results = await Promise.all(films.map(film => getParentsGuide(film, browser)));
  await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds timeout
  return results;
}

export async function POST(req: any, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const reqJson = await req.json();

    const listUrl = reqJson.listUrl;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(listUrl);

    const htmlContent = await page.content();
    console.log("LOG: Finished loading letterboxd page");

    const $ = load(htmlContent);
    let films: Film[] = [];

    $('div[class*="poster film-poster"]').each((index, element) => {
      const film: Film = {
        "film-id": $(element).attr("data-film-id") || "",
        "film-name": $(element).attr("data-film-name") || "",
        "poster-url": $(element).attr("data-poster-url") || "",
        "film-release-year": $(element).attr("data-film-release-year") || "",
        "film-link": $(element).attr("data-film-link") || "",
        "parentsGuide": {},
      };
      films.push(film);
    });

    const filmsToProcess = films.slice(0, 5);

    // Process films in batches of 5
    const batchSize = 5;
    let processedFilms: Film[] = [];

    for (let i = 0; i < filmsToProcess.length; i += batchSize) {
      const batch = filmsToProcess.slice(i, i + batchSize);
      console.log(`LOG: Processing batch ${i / batchSize + 1}`);
      const batchResults = await processBatch(batch, browser);
      processedFilms = [...processedFilms, ...batchResults];
    }

    await browser.close();

    return NextResponse.json({ films: processedFilms });
  } catch (error) {
    console.error("Error scraping films:", error);
    return NextResponse.json({ message: "Error scraping films" }, { status: 500 });
  }
}
