const PRODUCT_NAMES = ["UltraPhone X","CloudPad Pro","SwiftBook Air","NovaBuds","PixelWatch","EcoJacket","UrbanSneak","FlexShirt","VeloShorts","StormCap","NutriBar","FreshBlend","GreenTea Pack","PowerWhey","SpiceMix","CodeBook Pro","Design Patterns","Clean Code","AI Fundamentals","Python Guide","BuildiBlocks","RoboKit Jr","ScienceSet","ArtCraft Box","PuzzleMind","TrailRunner X","YogaMat Pro","SpeedRope","CycleHelm","FoamRoller","SmartBulb","AirPurifier","HomeHub","CoffeeMaker","BlenderPro","GlowSerum","HydraCreem","SunBlock SPF50","LipKit","HairMask","SoundBar Z","GamePad Elite","WebCam HD","MousePad XL","KeyboardMech","DeskLamp LED","OfficePack","ChairCushion","StorageBox","CablePack"];
const CATEGORIES = ["Electronics","Clothing","Food","Books","Toys","Sports","Home","Beauty"];
const BRANDS = ["TechNova","StyleCo","NutriLife","LearnBooks","PlayWorld","FitGear","HomeMart","GlowBeauty","CloudTech","EcoWear"];

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

export const productsData: Record<string, unknown>[] = Array.from({ length: 50 }, (_, i) => {
  const n = i + 1;
  return {
    id: n,
    name: PRODUCT_NAMES[i % PRODUCT_NAMES.length],
    category: CATEGORIES[i % CATEGORIES.length],
    price: Math.round(((n * 29 % 1500) + 2) * 100) / 100,
    stock: (n * 17) % 500,
    rating: Math.round(((3.0 + (n * 0.04 % 2.0)) * 10)) / 10,
    brand: BRANDS[i % BRANDS.length],
    available: n % 5 !== 0,
    createdAt: isoDate((n * 15) % 730),
  };
});
