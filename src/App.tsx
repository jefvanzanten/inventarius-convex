import StorageViewer from "./components/StorageViewer/StorageViewer";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Inventarius</h1>
      </header>
      <main className={styles.main}>
        <StorageViewer />
      </main>
    </div>
  );
}
