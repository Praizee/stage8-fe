import type { Schema } from "@/lib/query-engine/types";

export const usersSchema: Schema = {
  id: "users",
  name: "Users",
  description: "Application user accounts",
  tableName: "users",
  fields: [
    { key: "id",        label: "ID",         type: "number" },
    { key: "name",      label: "Name",        type: "string" },
    { key: "email",     label: "Email",       type: "string" },
    { key: "age",       label: "Age",         type: "number" },
    { key: "country",   label: "Country",     type: "enum",
      enumOptions: ["Nigeria","Ghana","Kenya","South Africa","USA","UK","Canada","Germany","France","Australia"] },
    { key: "status",    label: "Status",      type: "enum",
      enumOptions: ["active","inactive","suspended","pending"] },
    { key: "role",      label: "Role",        type: "enum",
      enumOptions: ["admin","user","moderator","editor"] },
    { key: "purchases", label: "Purchases",   type: "number" },
    { key: "createdAt", label: "Created At",  type: "date" },
    { key: "verified",  label: "Verified",    type: "boolean" },
  ],
};
