export type MarketRole = "buyer" | "seller" | "both" | "none";
export type VStatus =
  | "not_started"
  | "collecting"
  | "checking"
  | "approved"
  | "pending_review"
  | "rejected"
  | "needs_resubmission";
export type VType = "individual" | "business";
export type Material =
  | "plastic"
  | "metal"
  | "glass"
  | "cardboard"
  | "paper"
  | "wood"
  | "textiles"
  | "rubber";
export type AdminRole = "super" | "operations" | "support" | "finance" | "content";

export interface AuditEntry {
  at: string;
  actor: string;
  action: string;
  detail?: string;
}

export interface Verification {
  type: VType | null;
  basic: VStatus;
  full: VStatus;
  reason?: string;
  data: Record<string, string>;
  history: AuditEntry[];
}

export interface Deposit {
  id: string;
  binId: string;
  material: Material;
  measure: "weight" | "count";
  kg: number;
  count?: number;
  points: number;
  status: "verified" | "rejected";
  reason?: string;
  at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  createdAt: string;
  provider: "email" | "google";
  consent: { terms: string; privacy: string; at: string };
  prefs: { marketRole: MarketRole; akubin: boolean; onboarded: boolean; interests: Material[] };
  verification: Verification;
  points: number;
  deposits: Deposit[];
  pin?: string;
  saved: string[];
  savedArticles: string[];
  partner?: Partner["id"];
  demo?: boolean;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerBadge: "individual" | "business" | null;
  title: string;
  material: Material;
  grade: string;
  condition: "Baled" | "Loose" | "Sorted" | "Shredded" | "Mixed";
  qty: number;
  unit: "kg" | "tonne";
  price: number; // NGN per unit
  minOrder: number;
  partial: boolean;
  city: string;
  area: string;
  fulfilment: ("pickup" | "delivery")[];
  image: string;
  description: string;
  status: "draft" | "published" | "flagged" | "sold" | "paused";
  createdAt: string;
  views: number;
  flagReason?: string;
}

export interface OfferStep {
  by: "buyer" | "seller";
  price: number;
  qty: number;
  conditions: string[];
  at: string;
  action: "offer" | "counter" | "accept" | "reject" | "expire";
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  steps: OfferStep[];
  status: "awaiting_seller" | "awaiting_buyer" | "accepted" | "rejected" | "expired";
  expiresAt: string;
  orderId?: string;
}

export interface Quote {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  eta: string;
  vehicle: string;
  status: "submitted" | "selected" | "declined" | "expired";
}

export type OrderStatus =
  | "choose_fulfilment"
  | "awaiting_quotes"
  | "no_quotes"
  | "awaiting_payment"
  | "paid"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "proof_uploaded"
  | "confirmed"
  | "settled"
  | "disputed"
  | "refunded"
  | "cancelled";

export interface Order {
  id: string;
  offerId: string;
  listingId: string;
  title: string;
  material: Material;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  pickupCity: string;
  pickupArea: string;
  destination?: string;
  fulfilment?: "pickup" | "delivery";
  notified: string[];
  quotes: Quote[];
  quoteId?: string;
  payment: "unpaid" | "failed" | "held" | "released" | "refunded" | "partially_refunded";
  status: OrderStatus;
  proof?: string;
  inspectionDue?: string;
  dispute?: {
    reason: string;
    evidence: string;
    status: "open" | "under_review" | "resolved";
    decision?: string;
    at: string;
  };
  timeline: AuditEntry[];
  createdAt: string;
}

export interface BuyerRequest {
  id: string;
  buyerId: string;
  buyerName: string;
  material: Material;
  title: string;
  qty: number;
  unit: string;
  maxPrice: number;
  city: string;
  needBy: string;
  responses: { id: string; sellerId: string; sellerName: string; price: number; qty: number; note: string; at: string; status: "sent" | "shortlisted" | "declined" }[];
  createdAt: string;
}

export interface Bin {
  id: string;
  name: string;
  city: string;
  area: string;
  landmark: string;
  lat: number;
  lng: number;
  materials: Material[];
  status: "online" | "offline" | "full" | "maintenance";
  capacity: number; // percent full
  hours: string;
  collector?: string;
  nextCollection: string;
  events: AuditEntry[];
  tickets: { id: string; issue: string; status: "open" | "resolved"; at: string }[];
}

export interface Reward {
  id: string;
  name: string;
  kind: "airtime" | "cash" | "physical";
  cost: number;
  value: string;
  automated: boolean;
  stock?: number;
}

export interface Redemption {
  id: string;
  userId: string;
  userName: string;
  rewardId: string;
  rewardName: string;
  kind: Reward["kind"];
  cost: number;
  status: "completed" | "pending_review" | "approved" | "rejected" | "failed";
  reason?: string;
  at: string;
}

export interface Partner {
  id: string;
  ownerId?: string;
  business: string;
  contact: string;
  email: string;
  phone: string;
  base: string;
  areas: string[];
  materials: Material[];
  vehicles: string;
  vehicleCount: number;
  capacityKg: number;
  docs: string[];
  status: "pending" | "approved" | "rejected" | "suspended";
  rating: number;
  completed: number;
  appliedAt: string;
  reason?: string;
}

export interface Campaign {
  id: string;
  ownerId: string;
  advertiser: string;
  title: string;
  body: string;
  url: string;
  image: string;
  locations: string[];
  materials: Material[];
  roles: string[];
  pkg: "7d" | "14d" | "30d";
  price: number;
  payment: "unpaid" | "paid" | "failed";
  status: "draft" | "pending_review" | "approved" | "rejected";
  reason?: string;
  impressions: number;
  clicks: number;
  createdAt: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  category: string;
  author: string;
  readMins: number;
  image: string;
  status: "draft" | "published" | "unpublished";
  publishedAt: string;
}

export interface NewsCandidate {
  id: string;
  title: string;
  source: string;
  summary: string;
  url: string;
  status: "proposed" | "approved" | "rejected";
  at: string;
}

export interface Ticket {
  id: string;
  userId?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  channel: "ai_chat" | "contact" | "report" | "dispute";
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "assigned" | "resolved";
  assignee?: string;
  at: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  at: string;
}

export interface Intent {
  path: string;
  label: string;
  level: "basic" | "full";
}

export interface Settings {
  sellerFee: number;
  partnerFee: number;
  pointsPerKg: Record<Material, number>;
  pointsPerItem: number;
  itemKgEquivalent: number;
  airtimeMin: number;
  cashMin: number;
  pointValueNaira: number;
  inspectionHours: number;
}

export interface Enquiry {
  id: string;
  kind: "general" | "support" | "business" | "logistics";
  name: string;
  email: string;
  data: Record<string, string>;
  at: string;
}

export interface DB {
  version: number;
  sessionUserId: string | null;
  devRole: AdminRole | null;
  intent: Intent | null;
  users: User[];
  listings: Listing[];
  offers: Offer[];
  orders: Order[];
  requests: BuyerRequest[];
  bins: Bin[];
  rewards: Reward[];
  redemptions: Redemption[];
  partners: Partner[];
  campaigns: Campaign[];
  articles: Article[];
  news: NewsCandidate[];
  tickets: Ticket[];
  notifications: Notification[];
  enquiries: Enquiry[];
  settings: Settings;
  audit: AuditEntry[];
  binSessions: { code: string; binId: string; userId: string; expiresAt: string; used: boolean }[];
  leaderboard: { name: string; city: string; week: number; month: number; all: number }[];
}
