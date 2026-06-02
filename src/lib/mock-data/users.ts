const NAMES = ["Emeka Okafor","Amara Diallo","Kwame Mensah","Fatima Al-Hassan","Chen Wei","Sarah Mitchell","James Osei","Priya Sharma","Miguel Santos","Yuki Tanaka","Aisha Bello","Carlos Rivera","Ngozi Adeyemi","Thomas Mueller","Lila Patel","Omar Farouq","Grace Kimani","Raj Nair","Sofia Andersen","Kofi Acheampong","Zara Ahmed","Felix Wagner","Chioma Okonkwo","Lucas Ferreira","Nadia Hassan","David Kim","Abena Asante","Marco Romano","Layla Ibrahim","Jin-Ho Park","Blessing Taiwo","Elena Vasquez","Adebayo Ogundimu","Anna Kowalski","Selin Yilmaz","Emmanuel Asante","Rosa Martinez","Kwabena Frimpong","Mei Lin","Patrick O'Brien","Amina Sow","Viktor Petrov","Chiamaka Eze","Rafael Rodrigues","Hana Nakamura","Moses Waweru","Isabelle Laurent","Tobias Richter","Rukayat Balogun","Alex Thompson","Seun Adewale","Valentina Cruz","Mensah Owusu","Ingrid Holm","Bashir Saleh","Cecilia Morales","Nnamdi Chukwu","Yolanda Ferreira","Daisuke Sato","Maryam Hussain","Ernest Boateng","Carmen Lopez","Ayaan Khan","Theresa Nkrumah","Lukas Becker","Funmilayo Adesanya","Haruto Yamamoto","Gloria Osei","Antoine Dupont","Bola Adewumi","Nina Johansson","Chinedu Obi","Maria Silva","Hamid Rahimi","Stella Mensah","Bruno Costa","Zainab Musa","Katarina Weber","Femi Adeleke","Yuna Choi","Olumide Adeyemi","Camille Bernard","Ifeanyi Eze","Lars Eriksson","Patience Asare","Diego Hernandez","Ryo Suzuki","Chidinma Nwachukwu","Henrik Lindqvist","Sade Abiodun","Marcos Oliveira","Keiko Fujimoto","Wanjiru Kamau","Pierre Moreau","Tobi Olamide","Nora Fischer","Seun Ogunleye","Akiko Watanabe","Bolanle Adeleke","Stefan Zimmermann"];
const COUNTRIES = ["Nigeria","Ghana","Kenya","South Africa","USA","UK","Canada","Germany","France","Australia"];
const STATUSES = ["active","active","active","active","inactive","suspended","pending"] as const;
const ROLES = ["user","user","user","user","user","moderator","editor","admin"] as const;

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

export const usersData: Record<string, unknown>[] = Array.from({ length: 100 }, (_, i) => {
  const n = i + 1;
  const name = NAMES[i % NAMES.length];
  const emailName = name.toLowerCase().replace(/[^a-z]/g, ".").replace(/\.+/g, ".");
  return {
    id: n,
    name,
    email: `${emailName}@example.com`,
    age: 18 + (n * 7 % 52),
    country: COUNTRIES[i % COUNTRIES.length],
    status: STATUSES[i % STATUSES.length],
    role: ROLES[i % ROLES.length],
    purchases: (n * 13) % 201,
    createdAt: isoDate((n * 11) % 1095),
    verified: n % 3 !== 0,
  };
});
