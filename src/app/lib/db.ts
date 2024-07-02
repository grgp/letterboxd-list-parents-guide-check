import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db: any = null;

async function getDb() {
  if (!db) {
    db = await open({
      filename: './mydb.sqlite',
      driver: sqlite3.Database,
    });
    await db.exec(`
      CREATE TABLE IF NOT EXISTS films (
        letterboxd_film_id TEXT PRIMARY KEY,
        film_name TEXT,
        poster_url TEXT,
        film_release_year TEXT,
        film_link TEXT,
        parents_guide_severity TEXT,
        parents_guide_votes TEXT
      )
    `);
  }
  return db;
}

export { getDb };
