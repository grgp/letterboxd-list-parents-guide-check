import Image from "next/image";
import styles from "./page.module.css";
import FilmListPage from "./components/FilmListPage";
import LetterboxdListPage from "./components/LetterboxdListPage";

export default function Home() {
  return (
    <main>
      <h1>Letterboxd List Fetcher</h1>
      <LetterboxdListPage />
    </main>
  );
}