import type { DB, Material, User, Listing, Bin, Partner, Article } from "./types";

const now = Date.now();
const ago = (h: number) => new Date(now - h * 3600_000).toISOString();
const ahead = (h: number) => new Date(now + h * 3600_000).toISOString();

export const MATERIALS: { id: Material; label: string; hint: string }[] = [
  { id: "plastic", label: "Plastic", hint: "PET, HDPE, PP" },
  { id: "metal", label: "Metal", hint: "Aluminium, steel, copper" },
  { id: "glass", label: "Glass", hint: "Clear, green, amber" },
  { id: "cardboard", label: "Cardboard", hint: "OCC, cartons" },
  { id: "paper", label: "Paper", hint: "Office, newsprint" },
  { id: "wood", label: "Wood", hint: "Pallets, offcuts" },
  { id: "textiles", label: "Textiles", hint: "Cotton, mixed fabric" },
  { id: "rubber", label: "Rubber", hint: "Tyres, crumb" },
];

export const CONDITIONS = ["Inspection on pickup", "Moisture under 5%", "Weighbridge ticket required", "Delivery within 7 days", "Photos before dispatch"];

export const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Benin City", "Kaduna"];

export const TERMS_VERSION = "v1.0-draft (2026-11-01)";
export const PRIVACY_VERSION = "v1.0-draft (2026-11-01)";

const blankV = () => ({ type: null, basic: "not_started" as const, full: "not_started" as const, data: {}, history: [] });

function seedUser(id: string, name: string, email: string, city: string, vtype: "individual" | "business" | null, full = true): User {
  return {
    id,
    name,
    email,
    password: "demo-only",
    city,
    phone: "+234 80" + id.slice(-1) + " 000 0000",
    createdAt: ago(24 * 90),
    provider: "email",
    consent: { terms: TERMS_VERSION, privacy: PRIVACY_VERSION, at: ago(24 * 90) },
    prefs: { marketRole: "both", akubin: false, onboarded: true, interests: [] },
    verification: vtype
      ? { type: vtype, basic: "approved", full: full ? "approved" : "not_started", data: {}, history: [] }
      : blankV(),
    points: 0,
    deposits: [],
    saved: [],
    savedArticles: [],
    demo: true,
  };
}

const users: User[] = [
  seedUser("u-seed-1", "Ikeja Polymers Ltd", "ops@ikejapolymers.demo", "Lagos", "business"),
  seedUser("u-seed-2", "Chinedu Okafor", "chinedu@demo.ng", "Enugu", "individual"),
  seedUser("u-seed-3", "Apapa Metals Recovery", "trade@apapametals.demo", "Lagos", "business"),
  seedUser("u-seed-4", "Halima Bello", "halima@demo.ng", "Kano", "individual"),
  seedUser("u-seed-5", "GreenFibre Paper Mills", "buy@greenfibre.demo", "Ogun", "business"),
  seedUser("u-seed-6", "Tunde Adeyemi", "tunde@demo.ng", "Ibadan", "individual", false),
];

const L = (p: Partial<Listing> & Pick<Listing, "id" | "sellerId" | "title" | "material" | "qty" | "price" | "city" | "area">): Listing => {
  const seller = users.find((u) => u.id === p.sellerId)!;
  return {
    sellerName: seller.name,
    sellerBadge: seller.verification.basic === "approved" ? seller.verification.type : null,
    grade: "Grade A",
    condition: "Baled",
    unit: "kg",
    minOrder: 100,
    partial: true,
    fulfilment: ["pickup", "delivery"],
    image: p.material,
    description: "",
    status: "published",
    createdAt: ago(48),
    views: 120,
    ...p,
  } as Listing;
};

const listings: Listing[] = [
  L({ id: "L-1001", sellerId: "u-seed-1", title: "Clear PET bottle bales", material: "plastic", grade: "PET Grade A, labels on", qty: 4800, price: 320, city: "Lagos", area: "Ikeja", minOrder: 500, description: "Hot-washed clear PET, compressed into ~250kg bales. Stored indoors, minimal caps.", views: 412 }),
  L({ id: "L-1002", sellerId: "u-seed-3", title: "UBC aluminium cans, crushed", material: "metal", grade: "UBC, 95% purity", qty: 2200, price: 950, city: "Lagos", area: "Apapa", minOrder: 200, condition: "Sorted", views: 288 }),
  L({ id: "L-1003", sellerId: "u-seed-2", title: "Mixed cardboard (OCC)", material: "cardboard", grade: "OCC 11", qty: 3500, price: 110, city: "Enugu", area: "Ogui", condition: "Baled", minOrder: 300, fulfilment: ["pickup"], views: 97 }),
  L({ id: "L-1004", sellerId: "u-seed-4", title: "Green glass cullet", material: "glass", grade: "Green, crushed", qty: 6000, price: 70, city: "Kano", area: "Sharada", condition: "Shredded", minOrder: 1000, views: 54 }),
  L({ id: "L-1005", sellerId: "u-seed-1", title: "HDPE drums and jerrycans", material: "plastic", grade: "HDPE natural & coloured", qty: 1800, price: 280, city: "Lagos", area: "Ikeja", condition: "Loose", minOrder: 200, views: 163 }),
  L({ id: "L-1006", sellerId: "u-seed-5", title: "Sorted office paper", material: "paper", grade: "White ledger", qty: 2500, price: 140, city: "Abuja", area: "Idu Industrial", condition: "Sorted", minOrder: 250, views: 75 }),
  L({ id: "L-1007", sellerId: "u-seed-3", title: "Copper wire scrap", material: "metal", grade: "Bare bright #1", qty: 300, price: 7800, city: "Lagos", area: "Apapa", condition: "Sorted", minOrder: 20, partial: true, views: 510 }),
  L({ id: "L-1008", sellerId: "u-seed-6", title: "Pallet wood offcuts", material: "wood", grade: "Pine/hardwood mix", qty: 1200, price: 45, city: "Ibadan", area: "Oluyole", condition: "Mixed", minOrder: 300, fulfilment: ["pickup"], views: 22 }),
  L({ id: "L-1009", sellerId: "u-seed-2", title: "Post-consumer textiles", material: "textiles", grade: "Cotton-rich, sorted", qty: 900, price: 160, city: "Enugu", area: "Emene", condition: "Sorted", minOrder: 100, views: 41 }),
  L({ id: "L-1010", sellerId: "u-seed-4", title: "Tyre crumb rubber", material: "rubber", grade: "2–4mm crumb", qty: 5000, price: 95, city: "Kano", area: "Bompai", condition: "Shredded", minOrder: 500, views: 66 }),
  L({ id: "L-1011", sellerId: "u-seed-6", title: "PP woven sacks", material: "plastic", grade: "PP, mixed colour", qty: 700, price: 210, city: "Ibadan", area: "Bodija", condition: "Loose", minOrder: 100, views: 19 }),
  L({ id: "L-1012", sellerId: "u-seed-5", title: "Kraft cardboard tubes", material: "cardboard", grade: "Kraft", qty: 1500, price: 130, city: "Abuja", area: "Kubwa", condition: "Sorted", minOrder: 200, fulfilment: ["delivery"], views: 33 }),
];

const B = (b: Partial<Bin> & Pick<Bin, "id" | "name" | "city" | "area" | "landmark" | "lat" | "lng">): Bin => ({
  materials: ["plastic", "metal", "glass"],
  status: "online",
  capacity: 35,
  hours: "6:00am – 10:00pm daily",
  nextCollection: ahead(30),
  events: [{ at: ago(2), actor: "device", action: "heartbeat", detail: "Simulated" }],
  tickets: [],
  ...b,
});

const bins: Bin[] = [
  B({ id: "BIN-001", name: "Yaba Tech Gate", city: "Lagos", area: "Yaba", landmark: "Opposite YabaTech main gate", lat: 6.5175, lng: 3.3727, capacity: 42, collector: "Mainland Collect Co." }),
  B({ id: "BIN-002", name: "Lekki Phase 1 Mall", city: "Lagos", area: "Lekki", landmark: "Admiralty Way, car park entrance", lat: 6.4474, lng: 3.4723, capacity: 18, materials: ["plastic", "metal"] }),
  B({ id: "BIN-003", name: "Ikeja City Hall", city: "Lagos", area: "Ikeja", landmark: "Alausa Secretariat walkway", lat: 6.6018, lng: 3.3515, status: "full", capacity: 100 }),
  B({ id: "BIN-004", name: "Wuse Market East", city: "Abuja", area: "Wuse", landmark: "Gate 3, by the pharmacy row", lat: 9.0765, lng: 7.4689, capacity: 61, materials: ["plastic", "metal", "glass", "paper"] }),
  B({ id: "BIN-005", name: "Garki Area 11", city: "Abuja", area: "Garki", landmark: "Shopping complex forecourt", lat: 9.0333, lng: 7.4892, status: "offline", capacity: 50 }),
  B({ id: "BIN-006", name: "GRA Phase 2", city: "Port Harcourt", area: "GRA", landmark: "Tombia St. junction", lat: 4.8156, lng: 7.0498, capacity: 27 }),
  B({ id: "BIN-007", name: "UI Second Gate", city: "Ibadan", area: "Agbowo", landmark: "Beside the bus stop shelter", lat: 7.4443, lng: 3.8996, status: "maintenance", capacity: 70, tickets: [{ id: "MT-31", issue: "Weighing sensor calibration", status: "open", at: ago(20) }] }),
  B({ id: "BIN-008", name: "Surulere Stadium", city: "Lagos", area: "Surulere", landmark: "National Stadium, Gate B", lat: 6.4983, lng: 3.3653, capacity: 55, materials: ["plastic", "metal", "glass", "paper"] }),
];

const P = (p: Partial<Partner> & Pick<Partner, "id" | "business" | "base" | "areas" | "materials" | "capacityKg">): Partner => ({
  contact: "Operations desk",
  email: "dispatch@" + p.id + ".demo",
  phone: "+234 809 000 0000",
  vehicles: "Flatbed truck",
  vehicleCount: 3,
  docs: ["CAC certificate.pdf", "Vehicle insurance.pdf"],
  status: "approved",
  rating: 4.6,
  completed: 48,
  appliedAt: ago(24 * 60),
  ...p,
});

const partners: Partner[] = [
  P({ id: "p-swift", business: "SwiftHaul Logistics", base: "Lagos", areas: ["Lagos", "Ibadan", "Abuja"], materials: ["plastic", "metal", "cardboard", "paper", "glass"], capacityKg: 10000, vehicles: "10-tonne flatbeds", rating: 4.8, completed: 112 }),
  P({ id: "p-eko", business: "Eko Green Movers", base: "Lagos", areas: ["Lagos"], materials: ["plastic", "cardboard", "paper", "textiles"], capacityKg: 3000, vehicles: "Box vans", vehicleCount: 6, rating: 4.5 }),
  P({ id: "p-north", business: "Arewa Freight Partners", base: "Kano", areas: ["Kano", "Kaduna", "Abuja"], materials: ["glass", "metal", "rubber", "plastic"], capacityKg: 15000, vehicles: "Trailers", rating: 4.4, completed: 63 }),
  P({ id: "p-east", business: "Coal City Carriers", base: "Enugu", areas: ["Enugu", "Port Harcourt", "Lagos"], materials: ["cardboard", "textiles", "paper", "plastic"], capacityKg: 5000, vehicles: "Pickup trucks", rating: 4.2, completed: 31 }),
  P({ id: "p-new", business: "Delta Route Haulage", base: "Benin City", areas: ["Benin City", "Lagos"], materials: ["metal", "wood"], capacityKg: 8000, status: "pending", rating: 0, completed: 0, appliedAt: ago(30) }),
];

const art = (a: Partial<Article> & Pick<Article, "id" | "slug" | "title" | "excerpt" | "category">): Article => ({
  author: "AkuMart Editorial",
  readMins: 5,
  image: "materials",
  status: "published",
  publishedAt: ago(24 * 6),
  body: [
    a.excerpt,
    "Across Nigeria, recyclable materials move through informal networks of collectors, aggregators and processors. Prices vary by quality, sorting and location — which is why clear grading and verified counterparties matter.",
    "This article is demonstration content written for the AkuMart prototype. It summarises general practice and should not be treated as technical or legal guidance.",
  ],
  ...a,
});

const articles: Article[] = [
  art({ id: "a1", slug: "grading-pet-bales", title: "How buyers grade PET bales — and how to get a better price", excerpt: "Colour separation, cap removal and moisture are the three levers sellers control most.", category: "Guides", image: "plastic" }),
  art({ id: "a2", slug: "aluminium-can-basics", title: "Aluminium cans: why clean, crushed UBC sells faster", excerpt: "A short primer on UBC purity and what processors look for at the weighbridge.", category: "Materials", image: "metal", publishedAt: ago(24 * 12) }),
  art({ id: "a3", slug: "akubin-points-explained", title: "AkuBin points, explained", excerpt: "Points are only credited for verified deposits. Here’s how weight and item counts are treated.", category: "AkuBin", image: "kiosk", publishedAt: ago(24 * 3) }),
  art({ id: "a4", slug: "choosing-logistics-quotes", title: "Comparing delivery quotes for bulk recyclables", excerpt: "Price is only one factor — capacity, handling and timing matter too.", category: "Logistics", image: "truck", publishedAt: ago(24 * 20) }),
  art({ id: "a5", slug: "verification-why", title: "Why Marketplace trading requires verification", excerpt: "Verification protects both sides of a trade. Recycling with AkuBin never needs it.", category: "Trust & Safety", image: "yard", publishedAt: ago(24 * 9) }),
];

export function createSeed(): DB {
  return {
    version: 3,
    sessionUserId: null,
    devRole: null,
    intent: null,
    users,
    listings,
    offers: [],
    orders: [],
    requests: [
      { id: "R-201", buyerId: "u-seed-5", buyerName: "GreenFibre Paper Mills", material: "cardboard", title: "Seeking OCC bales, monthly", qty: 20, unit: "tonne", maxPrice: 125, city: "Abuja", needBy: ahead(24 * 21), responses: [], createdAt: ago(30) },
      { id: "R-202", buyerId: "u-seed-1", buyerName: "Ikeja Polymers Ltd", material: "plastic", title: "Coloured PET flakes wanted", qty: 3000, unit: "kg", maxPrice: 260, city: "Lagos", needBy: ahead(24 * 10), responses: [], createdAt: ago(60) },
      { id: "R-203", buyerId: "u-seed-3", buyerName: "Apapa Metals Recovery", material: "metal", title: "Steel scrap, HMS 1&2", qty: 15, unit: "tonne", maxPrice: 380, city: "Lagos", needBy: ahead(24 * 14), responses: [], createdAt: ago(90) },
    ],
    bins,
    rewards: [
      { id: "rw-air-500", name: "₦500 airtime", kind: "airtime", cost: 1000, value: "₦500", automated: true },
      { id: "rw-air-1000", name: "₦1,000 airtime", kind: "airtime", cost: 1900, value: "₦1,000", automated: true },
      { id: "rw-cash", name: "Cash withdrawal", kind: "cash", cost: 5000, value: "₦2,500+", automated: false },
      { id: "rw-bottle", name: "AkuMart steel water bottle", kind: "physical", cost: 1500, value: "1 item", automated: false, stock: 40 },
      { id: "rw-tote", name: "Recycled-fibre tote bag", kind: "physical", cost: 800, value: "1 item", automated: false, stock: 0 },
    ],
    redemptions: [],
    partners,
    campaigns: [
      { id: "C-1", ownerId: "u-seed-1", advertiser: "Ikeja Polymers Ltd", title: "Selling PET? We buy daily in Lagos", body: "Fast weighbridge, same-week payment through our provider.", url: "https://example.com", image: "plastic", locations: ["Lagos"], materials: ["plastic"], roles: ["seller"], pkg: "30d", price: 150000, payment: "paid", status: "approved", impressions: 4210, clicks: 188, createdAt: ago(24 * 5) },
      { id: "C-2", ownerId: "u-seed-3", advertiser: "Apapa Metals Recovery", title: "Copper & aluminium buyers", body: "Bring sorted non-ferrous metals.", url: "https://example.com", image: "metal", locations: ["Lagos"], materials: ["metal"], roles: ["seller"], pkg: "14d", price: 80000, payment: "paid", status: "pending_review", impressions: 0, clicks: 0, createdAt: ago(10) },
    ],
    articles,
    news: [
      { id: "N-1", title: "Lagos state outlines plastic waste collection guidelines", source: "Demo News Wire", summary: "Proposed external news item for editorial review (demo).", url: "https://example.com/news-1", status: "proposed", at: ago(6) },
      { id: "N-2", title: "Global PET prices soften in Q4", source: "Demo Commodities Desk", summary: "Proposed external trend candidate (demo).", url: "https://example.com/news-2", status: "approved", at: ago(48) },
      { id: "N-3", title: "Glass recycling plant announced in the North", source: "Demo Industry Daily", summary: "Unverified candidate awaiting editor decision (demo).", url: "https://example.com/news-3", status: "proposed", at: ago(20) },
    ],
    tickets: [
      { id: "T-501", name: "Kemi A.", email: "kemi@demo.ng", subject: "Points not showing after deposit", message: "Deposited at BIN-002 yesterday.", channel: "contact", priority: "normal", status: "open", at: ago(26) },
      { id: "T-502", name: "Musa I.", email: "musa@demo.ng", subject: "Partner application status", message: "When will I hear back?", channel: "ai_chat", priority: "low", status: "assigned", assignee: "Support A", at: ago(50) },
    ],
    notifications: [],
    enquiries: [],
    settings: {
      sellerFee: 5,
      partnerFee: 3,
      pointsPerKg: { plastic: 40, metal: 80, glass: 20, paper: 15, cardboard: 15, wood: 5, textiles: 10, rubber: 10 },
      pointsPerItem: 2,
      itemKgEquivalent: 0.02,
      airtimeMin: 1000,
      cashMin: 5000,
      pointValueNaira: 0.5,
      inspectionHours: 48,
    },
    audit: [{ at: ago(1), actor: "system", action: "Seeded demo data" }],
    binSessions: [],
    leaderboard: [
      { name: "Adaeze N.", city: "Lagos", week: 14.2, month: 48.6, all: 212.4 },
      { name: "Ibrahim K.", city: "Abuja", week: 11.8, month: 39.1, all: 180.0 },
      { name: "Folake O.", city: "Lagos", week: 9.4, month: 35.7, all: 96.3 },
      { name: "Emeka U.", city: "Port Harcourt", week: 7.1, month: 22.0, all: 140.8 },
      { name: "Zainab M.", city: "Ibadan", week: 4.6, month: 18.2, all: 51.9 },
    ],
  };
}
