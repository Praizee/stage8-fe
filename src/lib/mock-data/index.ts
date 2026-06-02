export { usersData } from "./users";
export { ordersData } from "./orders";
export { productsData } from "./products";

import { usersData } from "./users";
import { ordersData } from "./orders";
import { productsData } from "./products";

export const DATASET_MAP: Record<string, Record<string, unknown>[]> = {
  users: usersData,
  orders: ordersData,
  products: productsData,
};
