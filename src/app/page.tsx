import Image from "next/image";
import styles from "./page.module.css";
import FilmListPage from "./components/FilmListPage";

export default function Home() {
  return (
    <main>
      <h1>Letterboxd List Fetcher</h1>
      <FilmListPage />
    </main>
  );
}