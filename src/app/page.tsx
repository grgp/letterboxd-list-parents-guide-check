import Image from "next/image";
import styles from "./page.module.css";
import LetterboxdListPage from "./components/LetterboxdListPage";

export default function Home() {
  return (
    <main>
      <LetterboxdListPage />
    </main>
  );
}