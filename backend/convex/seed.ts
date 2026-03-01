import { internalMutation } from "./_generated/server";

/**
 * Seed data voor ontwikkeling en testen.
 * Uitvoeren via: npx convex run convex/seed:seedData
 */
export const seedData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const barilla = await ctx.db.insert("brands", { name: "Barilla" });
    const arla = await ctx.db.insert("brands", { name: "Arla" });
    const unilever = await ctx.db.insert("brands", { name: "Unilever" });

    const pasta = await ctx.db.insert("products", { name: "Pasta Penne", brandId: barilla });
    const melk = await ctx.db.insert("products", { name: "Volle melk", brandId: arla });
    const kaas = await ctx.db.insert("products", { name: "Gouda kaas", brandId: arla });
    const wasmiddel = await ctx.db.insert("products", { name: "Wasmiddel", brandId: unilever });

    const voorraadkast = await ctx.db.insert("locations", { name: "Voorraadkast" });
    const koelkast = await ctx.db.insert("locations", { name: "Koelkast" });
    await ctx.db.insert("locations", { name: "Vriezer" });

    await ctx.db.insert("storage", { productId: pasta, locationId: voorraadkast, amount: 500 });
    await ctx.db.insert("storage", { productId: melk, locationId: koelkast, amount: 2 });
    await ctx.db.insert("storage", { productId: kaas, locationId: koelkast, amount: 300 });
    await ctx.db.insert("storage", { productId: wasmiddel, locationId: voorraadkast, amount: 2 });
  },
});
