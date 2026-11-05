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
  /* ---------- UAE ---------- */
  Dubai: [
    "Jumeirah", "Al Barsha", "Deira", "Business Bay", "Dubai Marina", "Bur Dubai",
    "Downtown Dubai", "JLT", "Al Quoz", "Karama", "Satwa", "Al Nahda",
    "Dubai Silicon Oasis", "International City", "Mirdif", "Al Qusais",
    "Jebel Ali", "Palm Jumeirah", "Dubai Hills", "JVC", "Al Rigga",
  ],
  "Abu Dhabi": ["Khalidiyah", "Al Reem Island", "Yas Island", "Mussafah", "Corniche", "Al Wahda", "Saadiyat Island"],
  Sharjah: ["Al Majaz", "Al Nahda", "Al Qasimia", "Muwaileh", "Al Khan"],
  Ajman: ["Al Nuaimiya", "Al Rashidiya", "Al Jurf", "Al Rawda", "Corniche Ajman", "Al Hamidiya"],
  "Ras Al Khaimah": ["Al Nakheel", "Al Hamra", "Al Dhait", "Khuzam", "Al Mamourah", "Julphar"],
  "Al Ain": ["Al Jimi", "Al Mutawaa", "Al Khabisi", "Al Towayya", "Al Muwaiji", "Zakher"],

  /* ---------- Pakistan ---------- */
  Lahore: ["DHA", "Gulberg", "Johar Town", "Model Town", "Bahria Town", "Wapda Town", "Cantt", "Iqbal Town", "Shadman"],
  Karachi: ["Clifton", "DHA", "Gulshan-e-Iqbal", "North Nazimabad", "Saddar", "PECHS", "Bahadurabad"],
  Islamabad: ["F-6", "F-7", "F-10", "G-9", "G-11", "I-8", "Blue Area", "E-11"],
  Rawalpindi: ["Saddar", "Bahria Town", "Satellite Town", "Chaklala", "DHA Phase 2", "Commercial Market", "Raja Bazaar"],
  Faisalabad: ["Madina Town", "Peoples Colony", "D Ground", "Susan Road", "Jaranwala Road", "Millat Town", "Canal Road"],
  Multan: ["Gulgasht Colony", "Cantt", "Shah Rukn-e-Alam Colony", "Bosan Road", "Model Town", "Hussain Agahi"],
  Peshawar: ["University Town", "Hayatabad", "Saddar", "Gulbahar", "Dalazak Road", "Ring Road"],

  /* ---------- India ---------- */
  Delhi: ["Connaught Place", "Saket", "Dwarka", "Lajpat Nagar", "Karol Bagh", "Rohini", "Vasant Kunj", "Janakpuri"],
  Mumbai: ["Andheri", "Bandra", "Powai", "Borivali", "Colaba", "Juhu", "Thane"],
  Bengaluru: ["Koramangala", "Indiranagar", "Whitefield", "Jayanagar", "HSR Layout", "Electronic City", "Marathahalli"],
  Hyderabad: ["Banjara Hills", "Jubilee Hills", "Gachibowli", "Madhapur", "Secunderabad", "Kukatpally"],
  Chennai: ["T Nagar", "Anna Nagar", "Adyar", "Velachery", "OMR", "Mylapore"],
  Kolkata: ["Salt Lake", "Park Street", "Ballygunge", "New Town", "Howrah", "Dum Dum"],
  Pune: ["Koregaon Park", "Kothrud", "Hinjewadi", "Baner", "Viman Nagar", "Hadapsar"],

  /* ---------- Saudi Arabia ---------- */
  Riyadh: ["Olaya", "Al Malaz", "Al Nakheel", "Al Yasmin", "Al Sulaimaniyah", "Hittin", "Al Rawdah"],
  Jeddah: ["Al Hamra", "Al Rawdah", "Al Salamah", "Al Safa", "Al Balad", "Al Shati", "Al Andalus"],
  Dammam: ["Al Faisaliyah", "Al Shati", "Al Adamah", "Al Nakheel", "Al Badiyah"],
  Mecca: ["Al Aziziyah", "Al Shawqiyah", "Al Awali", "Al Naseem", "Al Zahir"],
  Medina: ["Quba", "Al Aziziyah", "Al Haram", "Al Khalidiyah", "Al Hijra"],
  Khobar: ["Al Aqrabiyah", "Al Corniche", "Al Ulaya", "Al Rakah", "Al Yarmouk"],

  /* ---------- Qatar ---------- */
  Doha: ["West Bay", "The Pearl", "Al Sadd", "Al Waab", "Msheireb", "Old Airport", "Bin Mahmoud", "Al Muntazah"],
  "Al Wakrah": ["Al Wukair", "Mesaieed", "Al Wakrah Souq"],
  "Al Khor": ["Al Khor Community", "Al Thakhira", "Al Dhakira"],
  Lusail: ["Marina District", "Fox Hills", "Qetaifan Island", "Lusail Boulevard"],

  /* ---------- Kuwait ---------- */
  "Kuwait City": ["Sharq", "Salhiya", "Dasman", "Mirgab", "Qibla", "Shuwaikh"],
  Hawally: ["Maidan Hawally", "Bayan", "Jabriya", "Rumaithiya", "Salwa", "Mishref"],
  Salmiya: ["Salem Al Mubarak", "Hamad Al Mubarak", "Baghdad Street", "Salmiya Seaside", "Block 10"],
  Farwaniya: ["Khaitan", "Jleeb Al Shuyoukh", "Abdullah Al Mubarak", "Omariya", "Ardiya", "Rabiya"],

  /* ---------- Oman ---------- */
  Muscat: ["Ruwi", "Al Khuwair", "Qurum", "Mutrah", "Seeb", "Al Mawaleh", "Bawshar", "Al Ghubra"],
  Salalah: ["Al Saada", "Awqad", "Dahariz", "Al Wadi", "Salalah Central"],
  Sohar: ["Sohar Industrial", "Al Hambar", "Falaj Al Qabail", "Sohar Corniche"],
  Nizwa: ["Nizwa Souq", "Firq", "Sa'al", "Nizwa Fort Area"],

  /* ---------- Bahrain ---------- */
  Manama: ["Seef", "Juffair", "Adliya", "Diplomatic Area", "Al Hoora", "Sanabis", "Bab Al Bahrain"],
  Riffa: ["East Riffa", "West Riffa", "Riffa Views", "Al Hajiyat"],
  Muharraq: ["Busaiteen", "Hidd", "Arad", "Galali", "Amwaj Islands", "Dair"],

  /* ---------- Bangladesh ---------- */
  Dhaka: ["Gulshan", "Banani", "Dhanmondi", "Uttara", "Mirpur", "Mohammadpur", "Motijheel", "Bashundhara"],
  Chittagong: ["Agrabad", "GEC Circle", "Panchlaish", "Khulshi", "Nasirabad", "Halishahar"],
  Khulna: ["Sonadanga", "Khalishpur", "Daulatpur", "Boyra", "Shib Bari"],
  Sylhet: ["Zindabazar", "Ambarkhana", "Subid Bazar", "Upashahar", "Tilagor"],

  /* ---------- United Kingdom ---------- */
  London: ["Westminster", "Camden", "Kensington", "Canary Wharf", "Croydon", "Ilford", "Harrow", "Wembley"],
  Birmingham: ["City Centre", "Edgbaston", "Sparkhill", "Handsworth", "Solihull", "Erdington"],
  Manchester: ["City Centre", "Didsbury", "Salford", "Rusholme", "Stockport", "Trafford"],
  Leeds: ["City Centre", "Headingley", "Chapel Allerton", "Roundhay", "Armley", "Moortown"],
  Glasgow: ["City Centre", "West End", "Southside", "Pollokshields", "Partick", "Merchant City"],
  Liverpool: ["City Centre", "Anfield", "Aigburth", "Wavertree", "Toxteth", "Allerton"],
  Bradford: ["City Centre", "Manningham", "Heaton", "Shipley", "Idle", "Eccleshill"],

  /* ---------- United States ---------- */
  "New York": ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Long Island City"],
  "Los Angeles": ["Hollywood", "Santa Monica", "Beverly Hills", "Downtown Los Angeles", "Pasadena", "Burbank", "Glendale"],
  Chicago: ["Loop", "Lincoln Park", "Wicker Park", "Hyde Park", "Lakeview", "River North"],
  Houston: ["Downtown", "Galleria", "Midtown", "The Heights", "Katy", "Sugar Land"],
  Miami: ["Brickell", "Coral Gables", "Wynwood", "Miami Beach", "Doral", "Hialeah"],
  Dallas: ["Uptown", "Deep Ellum", "Plano", "Irving", "Frisco", "Oak Lawn"],
  "San Francisco": ["Mission District", "SoMa", "Nob Hill", "Sunset District", "Marina District", "Richmond District"],

  /* ---------- Canada ---------- */
  Toronto: ["Downtown Toronto", "North York", "Scarborough", "Etobicoke", "Yorkville", "Markham"],
  Vancouver: ["Downtown Vancouver", "Kitsilano", "Burnaby", "Richmond", "Surrey", "Coquitlam"],
  Montreal: ["Plateau-Mont-Royal", "Downtown Montreal", "Laval", "Verdun", "Westmount", "Outremont"],
  Calgary: ["Beltline", "Kensington", "Downtown Calgary", "Marda Loop", "Bridgeland"],
  Ottawa: ["Centretown", "ByWard Market", "Kanata", "Nepean", "Orleans", "Westboro"],
  Mississauga: ["Square One", "Port Credit", "Erin Mills", "Streetsville", "Meadowvale", "Malton"],

  /* ---------- Australia ---------- */
  Sydney: ["CBD", "Parramatta", "Bondi", "Chatswood", "Manly", "Liverpool"],
  Melbourne: ["CBD", "St Kilda", "Richmond", "Southbank", "Footscray", "Box Hill"],
  Brisbane: ["CBD", "South Brisbane", "Fortitude Valley", "Chermside", "Indooroopilly", "Sunnybank"],
  Perth: ["CBD", "Fremantle", "Subiaco", "Joondalup", "Northbridge", "Cottesloe"],
  Adelaide: ["CBD", "Glenelg", "North Adelaide", "Norwood", "Prospect", "Mawson Lakes"],

  /* ---------- Germany ---------- */
  Berlin: ["Mitte", "Charlottenburg", "Kreuzberg", "Prenzlauer Berg", "Neukölln", "Friedrichshain"],
  Munich: ["Altstadt", "Schwabing", "Maxvorstadt", "Sendling", "Bogenhausen", "Haidhausen"],
  Hamburg: ["Altona", "St. Pauli", "Eimsbüttel", "Hamburg-Mitte", "Winterhude", "Harburg"],
  Frankfurt: ["Innenstadt", "Sachsenhausen", "Bockenheim", "Nordend", "Westend", "Bornheim"],
  Cologne: ["Altstadt", "Ehrenfeld", "Nippes", "Lindenthal", "Deutz", "Kalk"],

  /* ---------- France ---------- */
  Paris: ["Le Marais", "Montmartre", "Latin Quarter", "La Défense", "Bastille", "Belleville"],
  Lyon: ["Presqu'île", "Part-Dieu", "Vieux Lyon", "Croix-Rousse", "Villeurbanne", "Confluence"],
  Marseille: ["Vieux-Port", "Castellane", "Prado", "Joliette", "La Canebière", "Endoume"],
  Toulouse: ["Capitole", "Saint-Cyprien", "Compans-Caffarelli", "Blagnac", "Jean Jaurès", "Carmes"],
  Nice: ["Vieux Nice", "Promenade des Anglais", "Cimiez", "Libération", "Port Lympia", "Jean-Médecin"],

  /* ---------- Spain ---------- */
  Madrid: ["Salamanca", "Chamberí", "Centro", "Chamartín", "Retiro", "Moncloa"],
  Barcelona: ["Eixample", "Gràcia", "Sants", "Sant Martí", "Les Corts", "Ciutat Vella"],
  Valencia: ["Ciutat Vella", "L'Eixample", "Ruzafa", "El Cabanyal", "Benimaclet", "Campanar"],
  Seville: ["Triana", "Nervión", "Casco Antiguo", "Los Remedios", "Macarena", "Santa Cruz"],
  Malaga: ["Centro Histórico", "Teatinos", "Pedregalejo", "El Palo", "Cruz de Humilladero", "Churriana"],

  /* ---------- Italy ---------- */
  Rome: ["Centro Storico", "Trastevere", "Prati", "Parioli", "EUR", "Testaccio"],
  Milan: ["Duomo", "Navigli", "Porta Nuova", "Brera", "Isola", "Citylife"],
  Naples: ["Vomero", "Chiaia", "Centro Storico", "Fuorigrotta", "Posillipo", "Arenella"],
  Turin: ["Centro", "San Salvario", "Crocetta", "Lingotto", "Vanchiglia", "Santa Rita"],
  Florence: ["Santa Croce", "Oltrarno", "Duomo", "Campo di Marte", "Novoli", "Santo Spirito"],

  /* ---------- Turkey ---------- */
  Istanbul: ["Kadıköy", "Beşiktaş", "Şişli", "Beyoğlu", "Üsküdar", "Fatih", "Bakırköy", "Ataşehir"],
  Ankara: ["Çankaya", "Kızılay", "Keçiören", "Yenimahalle", "Etimesgut", "Bahçelievler"],
  Izmir: ["Konak", "Alsancak", "Karşıyaka", "Bornova", "Buca", "Bayraklı"],
  Antalya: ["Lara", "Konyaaltı", "Muratpaşa", "Kaleiçi", "Kepez", "Düden"],
  Bursa: ["Nilüfer", "Osmangazi", "Yıldırım", "Mudanya", "Görükle", "Kestel"],

  /* ---------- Egypt ---------- */
  Cairo: ["Nasr City", "Heliopolis", "Maadi", "Downtown Cairo", "Zamalek", "New Cairo", "Mohandessin"],
  Alexandria: ["Smouha", "Sidi Gaber", "Stanley", "San Stefano", "Miami", "Montaza"],
  Giza: ["Dokki", "Mohandessin", "6th of October", "Haram", "Sheikh Zayed", "Agouza"],
  "Sharm El Sheikh": ["Naama Bay", "Hadaba", "Sharks Bay", "Nabq", "Old Market"],

  /* ---------- South Africa ---------- */
  Johannesburg: ["Sandton", "Rosebank", "Randburg", "Midrand", "Fourways", "Soweto", "Bryanston"],
  "Cape Town": ["City Bowl", "Sea Point", "Claremont", "Bellville", "Century City", "Camps Bay"],
  Durban: ["Umhlanga", "Berea", "Westville", "Morningside", "Pinetown", "Durban North"],
  Pretoria: ["Centurion", "Hatfield", "Brooklyn", "Menlyn", "Waterkloof", "Arcadia"],

  /* ---------- Nigeria ---------- */
  Lagos: ["Ikeja", "Victoria Island", "Lekki", "Surulere", "Yaba", "Ikoyi", "Ajah"],
  Abuja: ["Wuse", "Garki", "Maitama", "Asokoro", "Gwarinpa", "Jabi"],
  Kano: ["Nassarawa", "Fagge", "Sabon Gari", "Bompai", "Gwale", "Tarauni"],
  "Port Harcourt": ["GRA", "Trans Amadi", "Rumuola", "D-Line", "Rumuokoro", "Diobu"],

  /* ---------- Malaysia ---------- */
  "Kuala Lumpur": ["Bukit Bintang", "KLCC", "Bangsar", "Cheras", "Mont Kiara", "Petaling Jaya", "Subang Jaya", "Ampang"],
  Penang: ["George Town", "Bayan Lepas", "Gurney", "Butterworth", "Air Itam", "Tanjung Bungah"],
  "Johor Bahru": ["Taman Molek", "Mount Austin", "Skudai", "Iskandar Puteri", "Permas Jaya", "Tebrau"],
  "Kota Kinabalu": ["Likas", "Luyang", "Inanam", "Damai", "Penampang", "Tanjung Aru"],

  /* ---------- Singapore ---------- */
  Singapore: ["Orchard", "Tampines", "Jurong East", "Woodlands", "Bishan", "Toa Payoh", "Bedok", "Novena"],

  /* ---------- Indonesia ---------- */
  Jakarta: ["Kemang", "Menteng", "Kelapa Gading", "Senayan", "Tebet", "Pondok Indah", "Kuningan"],
  Surabaya: ["Gubeng", "Tegalsari", "Wonokromo", "Rungkut", "Sukolilo", "Mulyorejo"],
  Bandung: ["Dago", "Cihampelas", "Buah Batu", "Setiabudi", "Antapani", "Braga"],
  Bali: ["Seminyak", "Kuta", "Ubud", "Denpasar", "Canggu", "Sanur", "Nusa Dua"],

  /* ---------- Thailand ---------- */
  Bangkok: ["Sukhumvit", "Silom", "Sathorn", "Chatuchak", "Ratchada", "Thonglor", "Siam"],
  Phuket: ["Patong", "Kata", "Karon", "Phuket Town", "Rawai", "Kamala"],
  "Chiang Mai": ["Nimman", "Old City", "Santitham", "Hang Dong", "San Sai", "Chang Phueak"],
  Pattaya: ["Jomtien", "Naklua", "Central Pattaya", "South Pattaya", "Pratumnak", "North Pattaya"],
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