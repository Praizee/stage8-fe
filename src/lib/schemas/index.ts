export { usersSchema } from "./users-schema";
export { ordersSchema } from "./orders-schema";
export { productsSchema } from "./products-schema";

import { usersSchema } from "./users-schema";
import { ordersSchema } from "./orders-schema";
import { productsSchema } from "./products-schema";
import type { Schema } from "@/lib/query-engine/types";

export const ALL_SCHEMAS: Schema[] = [usersSchema, ordersSchema, productsSchema];
