import type { LeadRow } from "@/types/lead";

export interface SearchInput {
  businessType: string;
  city: string; // country
  area: string; // "" = poori country / selected city
  cities?: string[]; // "All <country>" par saari cities
  minRating: number;
  maxRating: number;
  minReviews: number;
  noWebsiteOnly: boolean;
  batch?: number;
}

const FIELDS = [
  "places.id",
  "places.displayName",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.internationalPhoneNumber",
  "nextPageToken",
].join(",");

const SOCIAL = /facebook\.com|instagram\.com|linktr\.ee/i;
const MAX_PAGES = 3; // Google ek query par max 60 results deta hai
const MAX_QUERIES = 1500; // total queries, batches me chalengi
const BATCH_SIZE = 6; // ek request me kitni queries
const CONCURRENCY = 8;
const EMAIL_BUDGET_MS = 25000;

/* ---------- har business type ke alag keywords ---------- */
// Key bilkul wahi honi chahiye jo LeadFinder.tsx ke TYPES me hai
const KEYWORDS: Record<string, string[]> = {
  Clinics: [
    "clinic", "medical center", "polyclinic", "medical clinic", "dermatology clinic",
    "cosmetic clinic", "skin clinic", "laser clinic", "physiotherapy clinic",
    "pediatric clinic", "eye clinic", "ENT clinic", "orthopedic clinic",
    "gynecology clinic", "family medicine clinic", "general practitioner",
    "diagnostic center", "medical laboratory",
  ],
  "Dental clinics": [
    "dental clinic", "dentist", "dental center", "orthodontist", "dental implants",
    "teeth whitening", "pediatric dentist", "cosmetic dentist", "oral surgeon", "endodontist",
  ],
  Restaurants: [
    "restaurant", "cafe", "fast food", "pizza", "burger", "shawarma", "biryani", "grill",
    "seafood restaurant", "steakhouse", "bakery", "coffee shop", "Indian restaurant",
    "Lebanese restaurant", "Chinese restaurant", "Italian restaurant", "breakfast", "fine dining",
  ],
  Salons: [
    "beauty salon", "hair salon", "barber shop", "ladies salon", "gents salon", "nail salon",
    "spa", "makeup artist", "bridal salon", "beauty parlour", "massage center", "men's grooming",
  ],
  Gyms: [
    "gym", "fitness center", "yoga studio", "crossfit", "personal trainer", "martial arts",
    "pilates studio", "boxing gym", "ladies gym", "swimming club",
  ],
  "Real estate": [
    "real estate agency", "property dealer", "property management", "real estate broker",
    "property consultant", "estate agent", "rental agency",
  ],
  "Car repair": [
    "car repair", "auto garage", "car service center", "car wash", "tyre shop",
    "auto spare parts", "car detailing", "car AC repair", "body shop", "car dealer",
  ],
};

const SUBAREAS: Record<string, string[]> = {
  Dubai: [
    "Jumeirah", "Al Barsha", "Deira", "Business Bay", "Dubai Marina", "Bur Dubai",
    "Downtown Dubai", "JLT", "Al Quoz", "Karama", "Satwa", "Al Nahda",
    "Dubai Silicon Oasis", "International City", "Mirdif", "Al Qusais",
    "Jebel Ali", "Palm Jumeirah", "Dubai Hills", "JVC", "Al Rigga",
  ],
  "Abu Dhabi": ["Khalidiyah", "Al Reem Island", "Yas Island", "Mussafah", "Corniche", "Al Wahda", "Saadiyat Island"],
  Sharjah: ["Al Majaz", "Al Nahda", "Al Qasimia", "Muwaileh", "Al Khan"],
  Lahore: ["DHA", "Gulberg", "Johar Town", "Model Town", "Bahria Town", "Wapda Town", "Cantt", "Iqbal Town", "Shadman"],
  Karachi: ["Clifton", "DHA", "Gulshan-e-Iqbal", "North Nazimabad", "Saddar", "PECHS", "Bahadurabad"],
  Islamabad: ["F-6", "F-7", "F-10", "G-9", "G-11", "I-8", "Blue Area", "E-11"],
};

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}/g;
const BAD_EMAIL = /\.(png|jpe?g|gif|webp|svg|css|js)$|sentry|wixpress|example\.|domain\.com|your@|user@|@2x/i;

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadFinderBot/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function pickEmail(html: string): string | null {
  const mailto = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (mailto && !BAD_EMAIL.test(mailto[1])) return mailto[1].toLowerCase();
  const found = (html.match(EMAIL_RE) ?? []).find((e) => !BAD_EMAIL.test(e));
  return found ? found.toLowerCase() : null;
}

async function findEmail(website: string): Promise<string> {
  try {
    const base = new URL(website);
    const home = pickEmail(await fetchText(base.origin));
    if (home) return home;
    const contact = pickEmail(await fetchText(base.origin + "/contact"));
    return contact ?? "-";
  } catch {
    return "-";
  }
}

/* ---------- helpers ---------- */

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

interface Target {
  query: string;
  area: string;
}

function buildTargets(p: SearchInput): Target[] {
  const keywords = KEYWORDS[p.businessType] ?? [p.businessType];
  const locations: { label: string; text: string }[] = [];

  if (p.area) {
    locations.push({ label: p.area, text: `${p.area}, ${p.city}` });
    for (const sub of SUBAREAS[p.area] ?? []) {
      locations.push({ label: sub, text: `${sub}, ${p.area}, ${p.city}` });
    }
  } else if (p.cities && p.cities.length > 0) {
    for (const c of p.cities) {
      locations.push({ label: c, text: `${c}, ${p.city}` });
      for (const sub of SUBAREAS[c] ?? []) {
        locations.push({ label: sub, text: `${sub}, ${c}, ${p.city}` });
      }
    }
  } else {
    locations.push({ label: p.city, text: p.city });
  }

  // keyword-wise: pehle ek keyword saari locations par, phir agla keyword
  const targets: Target[] = [];
  for (const kw of keywords) {
    for (const l of locations) {
      targets.push({ query: `${kw} in ${l.text}`, area: l.label });
    }
  }
  return targets.slice(0, MAX_QUERIES);
}

async function searchOne(query: string): Promise<any[]> {
  const places: any[] = [];
  let pageToken: string | undefined;
  for (let i = 0; i < MAX_PAGES; i++) {
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_API_KEY!,
          "X-Goog-FieldMask": FIELDS,
        },
        body: JSON.stringify({ textQuery: query, pageSize: 20, pageToken }),
      });
      if (!res.ok) {
        if (i === 0) console.error("Places API", res.status, await res.text().catch(() => ""));
        break;
      }
      const data = await res.json();
      places.push(...(data.places ?? []));
      pageToken = data.nextPageToken;
      if (!pageToken) break;
    } catch {
      break;
    }
  }
  return places;
}

/* ---------- main ---------- */

export async function findLeads(p: SearchInput): Promise<{ leads: LeadRow[]; totalBatches: number }> {
  const all = buildTargets(p);
  const totalBatches = Math.max(1, Math.ceil(all.length / BATCH_SIZE));
  const batch = Math.max(0, p.batch ?? 0);
  const targets = all.slice(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE);

  const seen = new Map<string, { place: any; area: string }>();
  const results = await pool(targets, CONCURRENCY, async (t) => ({ t, places: await searchOne(t.query) }));
  for (const { t, places } of results) {
    for (const x of places) {
      if (x.id && !seen.has(x.id)) seen.set(x.id, { place: x, area: t.area });
    }
  }

  const unrated = p.minRating <= 0; // default (khule filters) me bina rating wale bhi dikhao

  const filtered = [...seen.values()].filter(({ place: x }) => {
    const hasRating = typeof x.rating === "number";
    if (hasRating) {
      if (x.rating < p.minRating || x.rating > p.maxRating) return false;
    } else if (!unrated) {
      return false;
    }
    if ((x.userRatingCount ?? 0) < p.minReviews) return false;
    if (p.noWebsiteOnly && x.websiteUri && !SOCIAL.test(x.websiteUri)) return false;
    return true;
  });

  const deadline = Date.now() + EMAIL_BUDGET_MS;

  const leads = await pool(filtered, 10, async ({ place: x, area }): Promise<LeadRow> => {
    const noSite = !x.websiteUri || SOCIAL.test(x.websiteUri);
    let email = "-";
    if (!noSite && Date.now() < deadline) email = await findEmail(x.websiteUri);
    const rating = typeof x.rating === "number" ? x.rating : 0;
    return {
      placeId: x.id,
      name: x.displayName?.text ?? "Unknown",
      rating: rating.toFixed(1),
      reviews: x.userRatingCount ?? 0,
    // pehle: phone: x.nationalPhoneNumber ?? "-",
phone: x.internationalPhoneNumber ?? "-",
      email,
      area,
      leadType: rating >= 4 ? "Website" : "Reputation",
      website: noSite ? "No website" : "Has website",
    };
  });

  return { leads, totalBatches };
}