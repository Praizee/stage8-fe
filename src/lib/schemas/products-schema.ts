import type { Schema } from "@/lib/query-engine/types";

export const productsSchema: Schema = {
  id: "products",
  name: "Products",
  description: "Product catalog",
  tableName: "products",
  fields: [
    { key: "id",        label: "ID",         type: "number" },
    { key: "name",      label: "Name",        type: "string" },
    { key: "category",  label: "Category",   type: "enum",
      enumOptions: ["Electronics","Clothing","Food","Books","Toys","Sports","Home","Beauty"] },
    { key: "price",     label: "Price ($)",   type: "number" },
    { key: "stock",     label: "Stock",       type: "number" },
    { key: "rating",    label: "Rating",      type: "number" },
    { key: "brand",     label: "Brand",       type: "string" },
    { key: "available", label: "Available",   type: "boolean" },
    { key: "createdAt", label: "Added At",    type: "date" },
  ],
};
