import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { load } from "cheerio";
import { Film } from "../../types/struct";


export async function POST(req: NextApiRequest, res: NextApiResponse) {
  console.log("Request:", req);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // console.log("Request:", req);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(
      "https://letterboxd.com/grgp/list/to-watch-3-w-descriptions/"
    );
    const htmlContent = await page.content();

    // console.log("Content:", htmlContent);

    const $ = load(htmlContent);
    const films: Film[] = [];

    $('div[class^="react-component poster film-poster"]').each((index, element) => {
      const film: Film = {
        "film-id": $(element).attr("data-film-id") || "",
        "film-name": $(element).attr("data-film-name") || "",
        "poster-url": $(element).attr("data-poster-url") || "",
        "film-release-year": $(element).attr("data-film-release-year") || "",
        "film-link": $(element).attr("data-film-link") || "",
      };
      films.push(film);
    });

    // console.log("Films:", films);

    await browser.close();

    return NextResponse.json({ films });
  } catch (error) {
    console.error("Error scraping films:", error);
    return NextResponse.json({ message: "Error scraping films" }, { status: 500 });
  }
}
