const CUSTOMERS = ["Emeka Okafor","Sarah Mitchell","Kwame Mensah","Priya Sharma","Thomas Mueller","Amara Diallo","Carlos Rivera","Yuki Tanaka","Grace Kimani","Omar Farouq","Chioma Okonkwo","Lucas Ferreira","David Kim","Felix Wagner","Layla Ibrahim","Zara Ahmed","Raj Nair","Anna Kowalski","Emmanuel Asante","Rosa Martinez"];
const ORDER_STATUSES = ["pending","processing","shipped","delivered","delivered","delivered","cancelled"] as const;
const PRIORITIES = ["low","medium","medium","high"] as const;
const COUNTRIES = ["Nigeria","Ghana","USA","UK","Kenya","Canada","Germany","South Africa","France","Australia"];

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

export const ordersData: Record<string, unknown>[] = Array.from({ length: 60 }, (_, i) => {
  const n = i + 1;
  return {
    id: n,
    orderId: `ORD-${String(10000 + n * 7).slice(-5)}`,
    customer: CUSTOMERS[i % CUSTOMERS.length],
    status: ORDER_STATUSES[i % ORDER_STATUSES.length],
    total: Math.round(((n * 37 % 2000) + 5) * 100) / 100,
    items: 1 + (n * 3 % 10),
    country: COUNTRIES[i % COUNTRIES.length],
    priority: PRIORITIES[i % PRIORITIES.length],
    createdAt: isoDate((n * 6) % 365),
  };
});
