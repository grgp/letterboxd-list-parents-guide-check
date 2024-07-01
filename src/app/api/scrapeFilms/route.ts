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
    
    const searchResults = await page.$$eval('div.g', (results) => 
      results.map(result => ({
        title: result.querySelector('h3')?.textContent || '',
        link: result.querySelector('a')?.href || ''
      }))
    );

    const imdbLink = searchResults.find(result => 
      result.link.includes('imdb.com') && result.link.includes('parentalguide')
    )?.link;

    if (!imdbLink) {
      throw new Error('IMDB Parents Guide page not found');
    }

    console.log("LOG: Finished finding IMDB link");

    await page.goto(imdbLink);
    
    const parentsGuideContent = await page.evaluate(() => {
      console.log("LOG: Evaluating parents guide content");

      const frighteningSection = document.querySelector('.advisory-frightening');
      if (!frighteningSection) return null;

      console.log("LOG: Frightening section found");

      const severityContainer = frighteningSection.querySelector('.advisory-severity-vote__container');
      if (!severityContainer) return null;

      console.log("LOG: Severity container found");

      const severitySpan = severityContainer.querySelector('span.ipl-status-pill');
      const severityAnchor = severityContainer.querySelector('a.advisory-severity-vote__message');

      return {
        severity: severitySpan ? severitySpan.textContent?.trim() : null,
        votes: severityAnchor ? severityAnchor.textContent?.trim() : null
      };
    });

    if (parentsGuideContent) {
      film.parentsGuide = {
        severity: parentsGuideContent.severity,
        votes: parentsGuideContent.votes
      };
    } else {
      film.parentsGuide = {
        severity: 'Not found',
        votes: 'Not found'
      };
    }
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

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://letterboxd.com/grgp/list/to-watch-3-w-descriptions/");
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
      };
      films.push(film);
    });

    // Process only the first 10 films
    films = films.slice(0, 3);

    // Get Parents Guide for each film
    films = await Promise.all(films.map(film => getParentsGuide(film, browser)));

    await browser.close();

    return NextResponse.json({ films });
  } catch (error) {
    console.error("Error scraping films:", error);
    return NextResponse.json({ message: "Error scraping films" }, { status: 500 });
  }
}
