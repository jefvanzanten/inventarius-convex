import { useQuery } from "convex/react";
import { api } from "../../../backend/convex/_generated/api";
import StorageItem from "../StorageItem/StorageItem";
import styles from "./StorageViewer.module.css";

export default function StorageViewer() {
  const entries = useQuery(api.storage.getAll);

  if (entries === undefined) {
    return <p className={styles.status}>Loading inventory...</p>;
  }

  if (entries.length === 0) {
    return <p className={styles.status}>No items in inventory.</p>;
  }

  return (
    <ul className={styles.list}>
      {entries.map((entry) => (
        <li key={entry._id}>
          <StorageItem entry={entry} />
        </li>
      ))}
    </ul>
  );
}
