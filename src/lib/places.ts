import type { LeadRow } from "@/types/lead";

export interface SearchInput {
  businessType: string;
  city: string;
  area: string; // "" = poora city
  minRating: number;
  maxRating: number;
  minReviews: number;
  noWebsiteOnly: boolean;
}

const FIELDS = [
  "places.id",
  "places.displayName",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "nextPageToken",
].join(",");

const SOCIAL = /facebook\.com|instagram\.com|linktr\.ee/i;
const MAX_PAGES = 2; // cost control (max ~40 results per search)

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

export async function findLeads(p: SearchInput): Promise<LeadRow[]> {
  const query = `${p.businessType} in ${p.area ? p.area + ", " : ""}${p.city}`;
  const places: any[] = [];
  let pageToken: string | undefined;

  for (let i = 0; i < MAX_PAGES; i++) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_API_KEY!,
        "X-Goog-FieldMask": FIELDS,
      },
      body: JSON.stringify({ textQuery: query, pageSize: 20, pageToken }),
    });
    if (!res.ok) throw new Error(`Places API ${res.status}`);
    const data = await res.json();
    places.push(...(data.places ?? []));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  const filtered = places
    .filter((x) => x.rating >= p.minRating && x.rating <= p.maxRating)
    .filter((x) => (x.userRatingCount ?? 0) >= p.minReviews)
    .filter((x) => !p.noWebsiteOnly || !x.websiteUri || SOCIAL.test(x.websiteUri));

  return Promise.all(
    filtered.map(async (x): Promise<LeadRow> => {
      const noSite = !x.websiteUri || SOCIAL.test(x.websiteUri);
      const email = noSite ? "-" : await findEmail(x.websiteUri);
      return {
        name: x.displayName?.text ?? "Unknown",
        rating: Number(x.rating).toFixed(1),
        reviews: x.userRatingCount ?? 0,
        phone: x.nationalPhoneNumber ?? "-",
        email,
        area: p.area || p.city,
        leadType: x.rating >= 4 ? "Website" : "Reputation",
        website: noSite ? "No website" : "Has website",
      };
    })
  );
}