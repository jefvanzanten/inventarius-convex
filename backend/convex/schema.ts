import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  brands: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  products: defineTable({
    name: v.string(),
    brandId: v.id("brands"),
  })
    .index("by_name", ["name"])
    .index("by_brand", ["brandId"]),

  locations: defineTable({
    name: v.string(),
    parentId: v.optional(v.id("locations")),
  }).index("by_name", ["name"]),

  storage: defineTable({
    productId: v.id("products"),
    locationId: v.optional(v.id("locations")),
    amount: v.number(),
    expirationDate: v.optional(v.string()),
  })
    .index("by_product", ["productId"])
    .index("by_location", ["locationId"])
    .index("by_product_location", ["productId", "locationId"]),
});
