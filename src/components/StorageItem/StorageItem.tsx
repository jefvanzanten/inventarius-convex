import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../backend/convex/_generated/api";
import styles from "./StorageItem.module.css";

type StorageEntry = NonNullable<FunctionReturnType<typeof api.storage.getAll>>[number];

interface Props {
  entry: StorageEntry;
}

export default function StorageItem({ entry }: Props) {
  return (
    <article className={styles.card}>
      <h2 className={styles.productName}>
        {entry.product?.name ?? "Unknown product"}
      </h2>
      <p className={styles.brand}>{entry.brand?.name ?? "Unknown brand"}</p>
      <dl className={styles.details}>
        <dt>Location</dt>
        <dd>{entry.location?.name ?? "No location"}</dd>
        <dt>Amount</dt>
        <dd>{entry.amount}</dd>
        {entry.expirationDate && (
          <>
            <dt>Expires</dt>
            <dd>{entry.expirationDate}</dd>
          </>
        )}
      </dl>
    </article>
  );
}
