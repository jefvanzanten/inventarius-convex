# Convex Backend — Uitleg & Gebruiksgids

## Architectuur overzicht

```
┌─────────────────────────────────────────────────────────┐
│  Tauri desktop app                                       │
│                                                          │
│  ┌──────────────────────┐                               │
│  │  React 19 (WebView)  │  ←─── jij schrijft hier UI   │
│  │                       │                               │
│  │  useQuery()          │──────────────────┐            │
│  │  useMutation()       │   WebSocket /    │            │
│  └──────────────────────┘   HTTP           │            │
│                                             │            │
└─────────────────────────────────────────────│────────────┘
                                              │
                                              ▼
                            ┌─────────────────────────────┐
                            │  Convex Backend (Docker)     │
                            │  poort 3210                  │
                            │                              │
                            │  queries / mutations         │
                            │  (backend/convex/*.ts)       │
                            │                              │
                            │  ┌──────────────────────┐   │
                            │  │  SQLite (intern)      │   │
                            │  └──────────────────────┘   │
                            └─────────────────────────────┘
```

De React frontend communiceert **nooit direct met de database**. Alles gaat via
Convex functies (queries en mutations) die op de backend draaien.

---

## Opstarten (development)

Drie terminals, in volgorde:

```bash
# Terminal 1 — backend engine starten
cd backend
docker compose up -d

# Terminal 2 — schema + functies deployen (watch mode)
cd backend
npx convex dev
# → Genereert backend/convex/_generated/ automatisch

# Terminal 3 — frontend starten
pnpm tauri dev
```

> **Belangrijk:** `convex dev` moet draaien voordat je de frontend start,
> anders bestaan de gegenereerde types nog niet.

---

## Schema → types → frontend (de kernflow)

Dit is het meest belangrijke concept om te begrijpen.

### Stap 1 — Je definieert een schema (`backend/convex/schema.ts`)

```typescript
products: defineTable({
  name: v.string(),
  barcode: v.optional(v.string()),
  categoryId: v.optional(v.id("categories")),
  isArchived: v.boolean(),
})
```

### Stap 2 — Je schrijft een query of mutation (`backend/convex/products.ts`)

```typescript
export const list = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const results = await ctx.db.query("products").collect();
    return args.includeArchived ? results : results.filter(p => !p.isArchived);
  },
});
```

### Stap 3 — `convex dev` genereert de types

`convex dev` analyseert schema + functies en schrijft `backend/convex/_generated/`:

```
_generated/
├── api.d.ts        ← type-safe verwijzingen naar al je functies
├── api.js          ← runtime object
├── dataModel.d.ts  ← types van je tabellen
└── server.d.ts     ← types voor query/mutation helpers
```

### Stap 4 — Frontend gebruikt de gegenereerde API

```typescript
import { api } from '../backend/convex/_generated/api';
// of via alias:
import { api } from '$convex/api';

const products = useQuery(api.products.list, { includeArchived: false });
//                        ↑ type-safe!  ↑ args worden ook gecheckt
```

Als je een functienaam typt fout, of de verkeerde args meegeeft → **TypeScript fout**, geen runtime error.

---

## ConvexProvider instellen

De `ConvexProvider` moet één keer hoog in de component tree gezet worden
(typisch `main.tsx` of `App.tsx`):

```tsx
// src/main.tsx
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ConvexProvider client={convex}>
    <App />
  </ConvexProvider>
);
```

De URL komt uit `.env`:
```dotenv
VITE_CONVEX_URL=http://127.0.0.1:3210
```

---

## React hooks

### `useQuery` — data ophalen (real-time)

```tsx
import { useQuery } from 'convex/react';
import { api } from '$convex/api';

function ProductList() {
  const products = useQuery(api.products.list, { includeArchived: false });

  if (products === undefined) return <p>Laden...</p>;

  return (
    <ul>
      {products.map(p => <li key={p._id}>{p.name}</li>)}
    </ul>
  );
}
```

**Hoe `useQuery` werkt:**
- Retourneert `undefined` tijdens het laden (eerste keer)
- Retourneert de data zodra die beschikbaar is
- **Automatisch real-time:** als iemand anders een product aanpast,
  herrendert deze component vanzelf — geen polling, geen refresh nodig
- Gebruikt een WebSocket verbinding op de achtergrond

### `useMutation` — data schrijven

```tsx
import { useMutation } from 'convex/react';
import { api } from '$convex/api';

function AddProduct() {
  const createProduct = useMutation(api.products.create);

  async function handleSubmit(name: string) {
    await createProduct({ name, isArchived: false });
    // Na deze await is de data al bijgewerkt in alle useQuery's
  }

  return <button onClick={() => handleSubmit('Pasta')}>Toevoegen</button>;
}
```

**Hoe `useMutation` werkt:**
- Retourneert een async functie
- Na uitvoeren triggert Convex automatisch alle relevante `useQuery` hooks opnieuw
- Transactioneel: of alles lukt, of niets

### `useConvexClient` — buiten React (imperatief)

Voor gebruik buiten een component, of in event handlers die niet in een component leven:

```typescript
import { useConvexClient } from 'convex/react';

const client = useConvexClient();

// Eenmalig ophalen (geen live subscription)
const products = await client.query(api.products.list, {});

// Mutation uitvoeren
await client.mutation(api.inventory.addStock, {
  productId: "...",
  locationId: "...",
  quantity: 1,
  unitId: "...",
  isConsumed: false,
});
```

---

## Beschikbare functies per module

### `api.categories`
| Functie | Type | Beschrijving |
|---------|------|-------------|
| `list` | query | Alle categorieën (optioneel incl. gearchiveerde) |
| `get` | query | Één categorie op ID |
| `create` | mutation | Nieuwe categorie aanmaken |
| `update` | mutation | Velden aanpassen |
| `archive` | mutation | Soft-delete (isArchived = true) |

### `api.units`
| Functie | Type | Beschrijving |
|---------|------|-------------|
| `list` | query | Alle eenheden (optioneel filter op type) |
| `getBySymbol` | query | Zoeken op symbool bijv. "kg" |
| `create` | mutation | Nieuwe eenheid |
| `update` | mutation | Velden aanpassen |
| `remove` | mutation | Harde delete (eenheden hebben geen history) |

### `api.products`
| Functie | Type | Beschrijving |
|---------|------|-------------|
| `list` | query | Alle producten (filter op categorie mogelijk) |
| `get` | query | Één product op ID |
| `getByBarcode` | query | Zoeken op barcode |
| `create` | mutation | Nieuw product |
| `update` | mutation | Velden aanpassen |
| `archive` | mutation | Soft-delete |

### `api.locations`
| Functie | Type | Beschrijving |
|---------|------|-------------|
| `list` | query | Alle locaties |
| `get` | query | Één locatie op ID |
| `create` | mutation | Nieuwe locatie (bijv. "Koelkast") |
| `update` | mutation | Velden aanpassen |
| `archive` | mutation | Soft-delete |

### `api.inventory`
| Functie | Type | Beschrijving |
|---------|------|-------------|
| `getByProduct` | query | Alle actieve batches van één product |
| `getByLocation` | query | Alle actieve voorraad op één locatie |
| `getExpiringSoon` | query | Items die binnen N dagen verlopen |
| `addStock` | mutation | Nieuwe batch toevoegen |
| `adjustQuantity` | mutation | Hoeveelheid aanpassen (deels verbruikt) |
| `markConsumed` | mutation | Batch volledig verbruikt markeren |
| `move` | mutation | Batch naar andere locatie verplaatsen |

### `api.shoppingList`
| Functie | Type | Beschrijving |
|---------|------|-------------|
| `list` | query | Openstaande items (optioneel incl. afgevinkt) |
| `addItem` | mutation | Item toevoegen |
| `complete` | mutation | Item afvinken |
| `remove` | mutation | Item verwijderen |
| `clearCompleted` | mutation | Alle afgevinkte items wissen |

---

## Data model details

### IDs in Convex

Elke rij krijgt automatisch een `_id` van type `Id<"tabelnaam">`. Dit is een
opaque string — niet zomaar een getal. Gebruik altijd `v.id("products")` in
je validator, nooit `v.string()` voor foreign keys.

```typescript
// Correct
{ productId: v.id("products") }

// Fout — verliest type-veiligheid
{ productId: v.string() }
```

### Datums als Unix timestamps

Alle datums in dit schema zijn opgeslagen als **milliseconden sinds epoch** (getal).
Dit is de Convex conventie:

```typescript
// Opslaan
purchaseDate: Date.now()

// Weergeven
new Date(inventory.purchaseDate).toLocaleDateString('nl-NL')

// Vergelijken
const isExpired = inventory.expiryDate < Date.now();
```

### Soft-delete patroon

Producten, categorieën en locaties worden nooit echt verwijderd — ze krijgen
`isArchived: true`. Dit voorkomt dat inventory-records kapot gaan als een
product "verwijderd" wordt.

```typescript
// Filteren in queries
const actief = await ctx.db.query("products")
  .filter(q => q.eq(q.field("isArchived"), false))
  .collect();
```

### Indexes

Elke tabel heeft indexes voor de meest gebruikte query-patronen. Gebruik
`.withIndex()` voor performante queries:

```typescript
// Snel — gebruikt de by_category index
ctx.db.query("products")
  .withIndex("by_category", q => q.eq("categoryId", catId))
  .collect()

// Traag bij grote datasets — full table scan
ctx.db.query("products")
  .filter(q => q.eq(q.field("categoryId"), catId))
  .collect()
```

---

## Productie-pad

Voor productie kan je schakelen naar **Convex Cloud** zonder enige codewijziging:

```bash
# 1. Account aanmaken op https://dashboard.convex.dev
# 2. Nieuw project aanmaken → je krijgt een deployment URL

# 3. Functies deployen naar cloud
cd backend
CONVEX_DEPLOY_KEY=prod:xxxxxxxx npx convex deploy

# 4. .env aanpassen
VITE_CONVEX_URL=https://jouw-deployment.convex.cloud
```

Convex Cloud biedt automatische schaalbaarheid, multi-region replicatie en
een beheerd dashboard — zonder extra infrastructuur te beheren.

---

## Veelgestelde vragen

**Waarom zie ik `undefined` bij `useQuery`?**
Dat is de initiële staat tijdens het laden. Check altijd op `undefined`:
```tsx
if (products === undefined) return <p>Laden...</p>;
```

**Hoe weet Convex welke queries opnieuw te laden na een mutation?**
Convex bijhoudt welke database-reads een query heeft gedaan. Na een mutation
die dezelfde data aanpast, triggert Convex automatisch de juiste queries opnieuw.

**Kan ik `async/await` gebruiken in een query handler?**
Ja, query en mutation handlers zijn altijd async:
```typescript
handler: async (ctx, args) => { ... }
```

**Wat als `convex dev` niet meer draait maar de frontend wel?**
De bestaande data is nog beschikbaar, maar real-time updates werken niet.
Herstart `convex dev` vanuit de `backend/` map.

**Hoe reset ik de database?**
```bash
cd backend
docker compose down -v   # verwijdert de convex_data volume
docker compose up -d
docker compose exec backend ./generate_admin_key.sh
npx convex dev           # schema opnieuw deployen
npx convex run convex/seed:seedData  # optioneel: seed data
```
