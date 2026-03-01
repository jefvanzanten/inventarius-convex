import { query } from "./_generated/server";

/** Returns all storage entries joined with product, brand, and location. */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("storage").collect();

    return Promise.all(
      entries.map(async (entry) => {
        const product = await ctx.db.get(entry.productId);
        const brand = product ? await ctx.db.get(product.brandId) : null;
        const location = entry.locationId
          ? await ctx.db.get(entry.locationId)
          : null;

        return {
          _id: entry._id,
          amount: entry.amount,
          expirationDate: entry.expirationDate ?? null,
          product: product ? { _id: product._id, name: product.name } : null,
          brand: brand ? { _id: brand._id, name: brand.name } : null,
          location: location ? { _id: location._id, name: location.name } : null,
        };
      })
    );
  },
});
