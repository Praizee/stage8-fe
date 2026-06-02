import type { Schema } from "@/lib/query-engine/types";

export const ordersSchema: Schema = {
  id: "orders",
  name: "Orders",
  description: "E-commerce order records",
  tableName: "orders",
  fields: [
    { key: "id",         label: "ID",          type: "number" },
    { key: "orderId",    label: "Order ID",     type: "string" },
    { key: "customer",   label: "Customer",     type: "string" },
    { key: "status",     label: "Status",       type: "enum",
      enumOptions: ["pending","processing","shipped","delivered","cancelled"] },
    { key: "total",      label: "Total ($)",    type: "number" },
    { key: "items",      label: "Items Count",  type: "number" },
    { key: "country",    label: "Country",      type: "enum",
      enumOptions: ["Nigeria","Ghana","Kenya","South Africa","USA","UK","Canada","Germany","France","Australia"] },
    { key: "priority",   label: "Priority",     type: "enum",
      enumOptions: ["low","medium","high"] },
    { key: "createdAt",  label: "Order Date",   type: "date" },
  ],
};
