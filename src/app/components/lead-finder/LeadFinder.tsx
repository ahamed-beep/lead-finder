"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PRESETS, RANGES } from "@/data/leads";
import { downloadLeadReport } from "@/lib/pdf";
import type { CheckboxState, LeadRow } from "@/types/lead";

/* ======================= COUNTRIES -> CITIES ======================= */

const COUNTRIES: Record<string, string[]> = {
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Al Ain"],
  Pakistan: ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar"],
  India: ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "Khobar"],
  Qatar: ["Doha", "Al Wakrah", "Al Khor", "Lusail"],
  Kuwait: ["Kuwait City", "Hawally", "Salmiya", "Farwaniya"],
  Oman: ["Muscat", "Salalah", "Sohar", "Nizwa"],
  Bahrain: ["Manama", "Riffa", "Muharraq"],
  Bangladesh: ["Dhaka", "Chittagong", "Khulna", "Sylhet"],
  "United Kingdom": ["London", "Birmingham", "Manchester", "Leeds", "Glasgow", "Liverpool", "Bradford"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "Dallas", "San Francisco"],
  Canada: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Mississauga"],
  Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  Germany: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
  France: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"],
  Spain: ["Madrid", "Barcelona", "Valencia", "Seville", "Malaga"],
  Italy: ["Rome", "Milan", "Naples", "Turin", "Florence"],
  Turkey: ["Istanbul", "Ankara", "Izmir", "Antalya", "Bursa"],
  Egypt: ["Cairo", "Alexandria", "Giza", "Sharm El Sheikh"],
  "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria"],
  Nigeria: ["Lagos", "Abuja", "Kano", "Port Harcourt"],
  Malaysia: ["Kuala Lumpur", "Penang", "Johor Bahru", "Kota Kinabalu"],
  Singapore: ["Singapore"],
  Indonesia: ["Jakarta", "Surabaya", "Bandung", "Bali"],
  Thailand: ["Bangkok", "Phuket", "Chiang Mai", "Pattaya"],
  "Saudi & Gulf Other": ["Riyadh"],
};
delete COUNTRIES["Saudi & Gulf Other"];

const COUNTRY_NAMES = Object.keys(COUNTRIES);
const DEFAULT_COUNTRY = "United Arab Emirates";
const DEFAULT_CUSTOM: [number, number] = [2.5, 4.5];

/* ======================= ICONS ======================= */

function Ico({ className, children, fill = "none" }: { className?: string; children: ReactNode; fill?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill}
      stroke={fill === "none" ? "currentColor" : "none"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

type P = { c?: string };

const IcoSearch = ({ c }: P) => (
  <Ico className={c}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Ico>
);
const IcoChevron = ({ c }: P) => (
  <Ico className={c}>
    <polyline points="6 9 12 15 18 9" />
  </Ico>
);
const IcoPin = ({ c }: P) => (
  <Ico className={c}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Ico>
);
const IcoStar = ({ c }: P) => (
  <Ico className={c} fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Ico>
);
const IcoSliders = ({ c }: P) => (
  <Ico className={c}>
    <line x1="21" y1="4" x2="14" y2="4" />
    <line x1="10" y1="4" x2="3" y2="4" />
    <line x1="21" y1="12" x2="12" y2="12" />
    <line x1="8" y1="12" x2="3" y2="12" />
    <line x1="21" y1="20" x2="16" y2="20" />
    <line x1="12" y1="20" x2="3" y2="20" />
    <line x1="14" y1="2" x2="14" y2="6" />
    <line x1="10" y1="10" x2="10" y2="14" />
    <line x1="14" y1="18" x2="14" y2="22" />
  </Ico>
);
const IcoBuilding = ({ c }: P) => (
  <Ico className={c}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </Ico>
);
const IcoGlobe = ({ c }: P) => (
  <Ico className={c}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </Ico>
);
const IcoPhone = ({ c }: P) => (
  <Ico className={c}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </Ico>
);
const IcoMail = ({ c }: P) => (
  <Ico className={c}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </Ico>
);
const IcoDownload = ({ c }: P) => (
  <Ico className={c}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Ico>
);
const IcoFile = ({ c }: P) => (
  <Ico className={c}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </Ico>
);
const IcoCopy = ({ c }: P) => (
  <Ico className={c}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Ico>
);
const IcoBookmark = ({ c, on }: P & { on?: boolean }) => (
  <Ico className={c}>
    <path fill={on ? "currentColor" : "none"} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </Ico>
);
const IcoCheck = ({ c }: P) => (
  <Ico className={c}>
    <polyline points="20 6 9 17 4 12" />
  </Ico>
);
const IcoCheckCheck = ({ c }: P) => (
  <Ico className={c}>
    <path d="M18 6 7 17l-5-5" />
    <path d="m22 10-7.5 7.5L13 16" />
  </Ico>
);
const IcoX = ({ c }: P) => (
  <Ico className={c}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Ico>
);
const IcoMinus = ({ c }: P) => (
  <Ico className={c}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </Ico>
);
const IcoSort = ({ c }: P) => (
  <Ico className={c}>
    <path d="m3 16 4 4 4-4" />
    <path d="M7 20V4" />
    <path d="M21 8l-4-4-4 4" />
    <path d="M17 4v16" />
  </Ico>
);

/* ======================= HELPERS (CSV / copy / save) ======================= */

const csvCell = (v: string | number | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;

function exportLeadsCsv(rows: LeadRow[]) {
  if (rows.length === 0) return;
  const header = ["Business name", "Rating", "Reviews", "Phone", "Email", "Area", "Lead type", "Website"];
  const body = rows.map((l) => [l.name, l.rating, l.reviews, l.phone, l.email, l.area, l.leadType, l.website]);
  const csv = [header, ...body].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback neeche */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

const leadKey = (l: LeadRow) => l.name + "|" + l.phone;
const SAVED_KEY = "lead-finder-saved";

/* ======================= SMALL UI ======================= */

function Checkbox({ state, onClick }: { state: CheckboxState; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors " +
        (state !== "off" ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white")
      }
    >
      {state === "some" ? <IcoMinus c="h-3 w-3" /> : state === "on" ? <IcoCheck c="h-3 w-3" /> : null}
    </button>
  );
}

const PILL_TONES = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  gray: "bg-gray-100 text-gray-500",
};

function Pill({ tone, children }: { tone: keyof typeof PILL_TONES; children: ReactNode }) {
  return (
    <span className={"inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium " + PILL_TONES[tone]}>
      {children}
    </span>
  );
}

function StatCard({ label, value, caption, icon }: { label: string; value: string; caption: string; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-2 text-xs text-gray-400">{caption}</div>
    </div>
  );
}

/* ======================= RATING SLIDER (dual thumb) ======================= */

const THUMB_SM =
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-white " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-blue-600";
const THUMB_MD =
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-blue-600 [&::-moz-range-thumb]:bg-white";

function RatingSlider({
  lo,
  hi,
  onChange,
  size,
}: {
  lo: number;
  hi: number;
  onChange: (lo: number, hi: number) => void;
  size: "sm" | "md";
}) {
  const pct = (v: number) => ((v - 1) / 4) * 100;
  const round = (v: number) => Math.round(v * 10) / 10;
  const thumb = size === "sm" ? THUMB_SM : THUMB_MD;
  const input =
    "pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent focus:outline-none " + thumb;

  return (
    <div className={size === "sm" ? "relative mx-1 mt-3.5 h-4" : "relative mt-4 h-5"}>
      <div
        className={
          "absolute top-1/2 w-full -translate-y-1/2 rounded-full bg-gray-200 " + (size === "sm" ? "h-1" : "h-1")
        }
      />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-blue-600"
        style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
      />
      <input
        type="range"
        min={1}
        max={5}
        step={0.1}
        value={lo}
        aria-label="Minimum rating"
        onChange={(e) => onChange(Math.min(round(Number(e.target.value)), round(hi - 0.1)), hi)}
        className={input}
        style={{ zIndex: lo > 4 ? 30 : 20 }}
      />
      <input
        type="range"
        min={1}
        max={5}
        step={0.1}
        value={hi}
        aria-label="Maximum rating"
        onChange={(e) => onChange(lo, Math.max(round(Number(e.target.value)), round(lo + 0.1)))}
        className={input}
        style={{ zIndex: 25 }}
      />
    </div>
  );
}

/* ======================= HERO ======================= */

function Hero({ location }: { location: string }) {
  return (
    <div className="flex flex-col gap-2 pt-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="order-first sm:order-last sm:pb-1">
        <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-400">
          Sample workspace
        </span>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[32px] sm:leading-tight">
          Find businesses that need your services
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          <span className="sm:hidden">Discover local opportunities in {location}.</span>
          <span className="hidden sm:inline">
            Discover local opportunities. Turn the right businesses into your next clients.
          </span>
        </p>
      </div>
    </div>
  );
}

/* ======================= FILTER CARD ======================= */

interface FilterProps {
  preset: number;
  onPresetChange: (i: number) => void;
  minR: number;
  maxR: number;
  onRangeChange: (lo: number, hi: number) => void;
  country: string;
  onCountryChange: (v: string) => void;
  cities: string[];
  area: number;
  onAreaChange: (i: number) => void;
  location: string;
  noWebsiteOnly: boolean;
  onToggleNoWebsite: () => void;
  businessType: string;
  onBusinessTypeChange: (v: string) => void;
  minReviews: string;
  onMinReviewsChange: (v: string) => void;
  onSearch: () => void;
  loading: boolean;
  onReset: () => void;
}

const field =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-slate-700 focus:border-blue-400 focus:outline-none";
const sheetField =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 focus:border-blue-400 focus:outline-none";

const TYPES = ["Clinics", "Dental clinics", "Restaurants"];

function FilterCard({
  preset,
  onPresetChange,
  minR,
  maxR,
  onRangeChange,
  country,
  onCountryChange,
  cities,
  area,
  onAreaChange,
  location,
  noWebsiteOnly,
  onToggleNoWebsite,
  businessType,
  onBusinessTypeChange,
  minReviews,
  onMinReviewsChange,
  onSearch,
  loading,
  onReset,
}: FilterProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const toggle = (size: "sm" | "md") => (
    <button
      onClick={onToggleNoWebsite}
      aria-pressed={noWebsiteOnly}
      className={
        "relative rounded-full transition-colors " +
        (size === "sm" ? "h-5 w-9 " : "h-6 w-11 ") +
        (noWebsiteOnly ? "bg-blue-600" : "bg-gray-200")
      }
    >
      <span
        className={
          "absolute top-0.5 rounded-full bg-white shadow transition-all " +
          (size === "sm" ? "h-4 w-4 " : "h-5 w-5 ") +
          (noWebsiteOnly ? (size === "sm" ? "left-[18px]" : "left-[22px]") : "left-0.5")
        }
      />
    </button>
  );

  const findBtnLabel = loading ? "Searching..." : "Find Leads";

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* ---------- desktop ---------- */}
      <div className="hidden p-5 lg:block">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            {PRESETS.map((p, i) => (
              <button
                key={p.title}
                onClick={() => onPresetChange(i)}
                className={
                  "rounded-lg border px-4 py-2 text-left transition-colors " +
                  (preset === i ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50")
                }
              >
                <div className={"text-sm font-semibold " + (preset === i ? "text-blue-600" : "text-slate-700")}>
                  {p.title}
                </div>
                <div className={"text-[11px] " + (preset === i ? "text-blue-400" : "text-gray-400")}>{p.sub}</div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 pt-2 text-sm text-gray-500">
            <IcoPin c="h-4 w-4 text-gray-400" />
            {location}
          </div>
        </div>

        <div className="mt-5 flex items-end gap-4">
          <div className="w-56">
            <label className="text-xs font-medium text-gray-600">Business type</label>
            <div className="relative mt-1.5">
              <select
                value={businessType}
                onChange={(e) => onBusinessTypeChange(e.target.value)}
                className={field + " appearance-none"}
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <IcoChevron c="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="w-56">
            <label className="text-xs font-medium text-gray-600">Country</label>
            <div className="relative mt-1.5">
              <select
                value={country}
                onChange={(e) => onCountryChange(e.target.value)}
                className={field + " appearance-none"}
              >
                {COUNTRY_NAMES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <IcoChevron c="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="max-w-xs flex-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">Rating range</label>
              <span className="text-xs font-medium text-blue-600">
                {minR.toFixed(1)} – {maxR.toFixed(1)}
              </span>
            </div>
            <RatingSlider lo={minR} hi={maxR} onChange={onRangeChange} size="sm" />
          </div>

          <div className="w-32">
            <label className="text-xs font-medium text-gray-600">Min reviews</label>
            <div className="relative mt-1.5">
              <input
                value={minReviews}
                inputMode="numeric"
                onChange={(e) => onMinReviewsChange(e.target.value)}
                className={field}
              />
              <IcoSliders c="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-2.5 pb-2.5">
            <span className="text-sm text-slate-700">No website only</span>
            {toggle("sm")}
          </div>

          <button
            onClick={onSearch}
            disabled={loading}
            className="ml-auto flex h-10 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <IcoSearch c="h-4 w-4" />
            {findBtnLabel}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          <span className="text-xs text-gray-400">Cities</span>
          {cities.map((a, i) => (
            <button
              key={a}
              onClick={() => onAreaChange(i)}
              className={
                "rounded-md px-2.5 py-1 text-xs transition-colors " +
                (area === i ? "bg-blue-50 font-medium text-blue-600" : "text-gray-600 hover:bg-gray-50")
              }
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- mobile summary ---------- */}
      <div className="p-4 lg:hidden">
        <div className="flex gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.title}
              onClick={() => onPresetChange(i)}
              className={
                "flex-1 whitespace-nowrap rounded-lg border px-2 py-2 text-center text-[11px] font-semibold transition-colors sm:text-xs " +
                (preset === i ? "border-blue-400 bg-blue-50 text-blue-600" : "border-gray-200 bg-white text-slate-700")
              }
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 p-4">
          <div>
            <div className="text-sm font-semibold text-slate-800">Filters included</div>
            <div className="mt-1 text-xs text-gray-500">
              {location} · {minR.toFixed(1)}–{maxR.toFixed(1)} ★ · {minReviews || 0}+ reviews
            </div>
          </div>
          <IcoSliders c="h-4 w-4 text-gray-400" />
        </div>

        <div className="mt-3 flex gap-2.5">
          <button
            onClick={() => setSheetOpen(true)}
            className="flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700"
          >
            <IcoSliders c="h-4 w-4 text-gray-500" />
            Filters
          </button>
          <button
            onClick={onSearch}
            disabled={loading}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white disabled:opacity-60"
          >
            <IcoSearch c="h-4 w-4" />
            {findBtnLabel}
          </button>
        </div>
      </div>

      {/* ---------- mobile bottom sheet ---------- */}
      {sheetOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white px-5 pb-7 pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)]">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-gray-300" />

            <div className="mt-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Search filters</h2>
              <button onClick={() => setSheetOpen(false)} aria-label="Close">
                <IcoX c="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="mt-5 flex gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={p.title}
                  onClick={() => onPresetChange(i)}
                  className={
                    "flex-1 whitespace-nowrap rounded-xl px-2 py-3 text-[13px] font-semibold " +
                    (preset === i
                      ? "border border-blue-200 bg-blue-50 text-blue-600"
                      : "border border-gray-200 bg-white text-gray-700")
                  }
                >
                  {p.title}
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm font-semibold text-gray-800">Business type</p>
            <div className="relative mt-2.5">
              <select
                value={businessType}
                onChange={(e) => onBusinessTypeChange(e.target.value)}
                className={sheetField + " appearance-none"}
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <IcoChevron c="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-800">Country</p>
            <div className="relative mt-2.5">
              <select
                value={country}
                onChange={(e) => onCountryChange(e.target.value)}
                className={sheetField + " appearance-none"}
              >
                {COUNTRY_NAMES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <IcoChevron c="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-800">Cities</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {cities.map((a, i) => (
                <button
                  key={a}
                  onClick={() => {
                    onAreaChange(i);
                    setSheetOpen(false);
                  }}
                  className={
                    "rounded-lg px-3 py-2 text-xs font-semibold " +
                    (area === i ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")
                  }
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Rating range</p>
              <span className="text-sm font-semibold text-blue-600">
                {minR.toFixed(1)} - {maxR.toFixed(1)}
              </span>
            </div>
            <RatingSlider lo={minR} hi={maxR} onChange={onRangeChange} size="md" />

            <p className="mt-6 text-sm font-semibold text-gray-800">Min reviews</p>
            <input
              value={minReviews}
              inputMode="numeric"
              onChange={(e) => onMinReviewsChange(e.target.value)}
              className={sheetField + " mt-2.5"}
            />

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">No website only</p>
              {toggle("md")}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onReset}
                className="rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setSheetOpen(false);
                  onSearch();
                }}
                className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white"
              >
                <IcoSearch c="h-4 w-4" />
                Find Leads
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================= STATS ======================= */

function StatsRow({ leads, businessType, location }: { leads: LeadRow[]; businessType: string; location: string }) {
  const total = leads.length;
  const noWebsite = leads.filter((l) => l.website === "No website").length;
  const totalReviews = leads.reduce((sum, l) => sum + (Number(l.reviews) || 0), 0);
  const avg = total ? leads.reduce((sum, l) => sum + (Number(l.rating) || 0), 0) / total : 0;
  const withPhone = leads.filter((l) => l.phone && l.phone !== "-").length;

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <StatCard
        label="Total found"
        value={String(total)}
        caption={`${businessType} in ${location}`}
        icon={<IcoBuilding c="h-4 w-4" />}
      />
      <StatCard
        label="No website"
        value={String(noWebsite)}
        caption="Website opportunities"
        icon={<IcoGlobe c="h-4 w-4" />}
      />
      <StatCard
        label="Avg rating"
        value={avg.toFixed(1)}
        caption={`Across ${totalReviews} reviews`}
        icon={<IcoStar c="h-4 w-4" />}
      />
      <StatCard
        label="Phone available"
        value={`${withPhone} / ${total}`}
        caption="Ready to reach out"
        icon={<IcoPhone c="h-4 w-4" />}
      />
    </div>
  );
}

/* ======================= LEADS HEADER + TOOLBAR ======================= */

function LeadsHeader({
  count,
  savedCount,
  showSaved,
  onToggleSaved,
}: {
  count: number;
  savedCount: number;
  showSaved: boolean;
  onToggleSaved: () => void;
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          {showSaved ? "Saved leads" : "Your leads"}
        </h2>
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{count} results</span>
      </div>
      <button
        onClick={onToggleSaved}
        className={
          "flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors " +
          (showSaved
            ? "border-blue-400 bg-blue-50 text-blue-600"
            : "border-gray-200 bg-white text-slate-700 hover:bg-gray-50")
        }
      >
        <IcoBookmark c="h-3.5 w-3.5" on={showSaved} />
        Saved ({savedCount})
      </button>
    </div>
  );
}

const toolbarBtn =
  "flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-medium text-slate-700 transition-colors hover:bg-gray-50 disabled:opacity-50 sm:px-4 sm:text-sm lg:flex-none";

interface ToolbarProps {
  query: string;
  onQueryChange: (v: string) => void;
  disabled: boolean;
  onExportCsv: () => void;
  onDownloadPdf: () => void;
  onCopyPhones: () => void;
}

function LeadsToolbar({ query, onQueryChange, disabled, onExportCsv, onDownloadPdf, onCopyPhones }: ToolbarProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative lg:w-80">
        <IcoSearch c="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Filter by name, area or phone"
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none"
        />
      </div>
      <div className="flex gap-2.5">
        <button className={toolbarBtn} onClick={onExportCsv} disabled={disabled}>
          <IcoDownload c="h-4 w-4 text-gray-500" />
          Export CSV
        </button>
        <button className={toolbarBtn} onClick={onDownloadPdf} disabled={disabled}>
          <IcoFile c="h-4 w-4 text-gray-500" />
          Download PDF
        </button>
        <button className={toolbarBtn} onClick={onCopyPhones} disabled={disabled}>
          <IcoCopy c="h-4 w-4 text-gray-500" />
          Copy phones
        </button>
      </div>
    </div>
  );
}

/* ======================= LEADS LIST (mobile cards + desktop table) ======================= */

interface ListProps {
  all: LeadRow[];
  leads: LeadRow[];
  selected: number[];
  onToggle: (i: number) => void;
  headerState: CheckboxState;
  onToggleAll: () => void;
  onDownloadOne: (lead: LeadRow) => void;
  savedKeys: string[];
  onToggleSave: (lead: LeadRow) => void;
}

const COLUMNS = ["Business name", "Rating", "Reviews", "Phone", "Email", "Area", "Lead type", "Website"];

const hasEmail = (e?: string) => !!e && e !== "-";

function LeadsList({
  all,
  leads,
  selected,
  onToggle,
  headerState,
  onToggleAll,
  onDownloadOne,
  savedKeys,
  onToggleSave,
}: ListProps) {
  const empty = <p className="px-4 py-10 text-center text-sm text-gray-400">No leads match your filter.</p>;

  return (
    <>
      {/* ---------- mobile cards ---------- */}
      <div className="mt-3 flex flex-col gap-3 lg:hidden">
        {leads.map((l) => {
          const i = all.indexOf(l);
          const on = selected.includes(i);
          const isSaved = savedKeys.includes(leadKey(l));
          return (
            <div
              key={i}
              className={
                "rounded-xl border p-4 transition-colors " +
                (on ? "border-blue-200 bg-blue-50/70" : "border-gray-200 bg-white")
              }
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <Checkbox state={on ? "on" : "off"} onClick={() => onToggle(i)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">{l.name}</div>
                  <div className="mt-0.5 text-xs text-gray-500">{l.area}</div>
                </div>
                <button
                  onClick={() => onToggleSave(l)}
                  aria-label={isSaved ? "Remove from saved" : "Save lead"}
                  className={isSaved ? "text-blue-600" : "text-gray-400"}
                >
                  <IcoBookmark c="h-4 w-4" on={isSaved} />
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 pl-[30px]">
                <span className="flex items-center gap-1 text-xs text-slate-600">
                  <IcoStar c="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-medium">{l.rating}</span>
                  <span className="text-gray-400">· {l.reviews} reviews</span>
                </span>
                <Pill tone={l.leadType === "Website" ? "blue" : "amber"}>{l.leadType}</Pill>
                <Pill tone={l.website === "No website" ? "blue" : "gray"}>{l.website}</Pill>
              </div>
              <div className="mt-2 flex items-center gap-1.5 pl-[30px] text-xs text-slate-600">
                <IcoPhone c="h-3.5 w-3.5 text-gray-400" />
                {l.phone}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 pl-[30px] text-xs text-slate-600">
                <IcoMail c="h-3.5 w-3.5 text-gray-400" />
                {hasEmail(l.email) ? (
                  <a href={"mailto:" + l.email} className="min-w-0 break-all text-blue-600">
                    {l.email}
                  </a>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
              <div className="mt-3 flex gap-2 pl-[30px]">
                <a
                  href={"tel:" + l.phone.replace(/\s/g, "")}
                  className="flex h-9 flex-[1.2] items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white"
                >
                  <IcoPhone c="h-3.5 w-3.5" />
                  Call
                </a>
                <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-slate-700">
                  <IcoPin c="h-3.5 w-3.5 text-gray-500" />
                  Maps
                </button>
                <button
                  onClick={() => onDownloadOne(l)}
                  className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-slate-700"
                >
                  <IcoFile c="h-3.5 w-3.5 text-gray-500" />
                  PDF
                </button>
              </div>
            </div>
          );
        })}
        {leads.length === 0 && <div className="rounded-xl border border-gray-200 bg-white">{empty}</div>}
      </div>

      {/* ---------- desktop table ---------- */}
      <div className="mt-4 hidden overflow-hidden rounded-xl border border-gray-200 bg-white lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              <th className="w-12 px-4 py-3">
                <Checkbox state={headerState} onClick={onToggleAll} />
              </th>
              {COLUMNS.map((h) => (
                <th key={h} className="px-4 py-3 text-left font-normal">
                  <span className="inline-flex items-center gap-1">
                    {h}
                    <IcoSort c="h-3 w-3 text-gray-400" />
                  </span>
                </th>
              ))}
              <th className="px-3 py-3 font-normal">Maps</th>
              <th className="px-3 py-3 font-normal">PDF</th>
              <th className="px-4 py-3 text-left font-normal">Save</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => {
              const i = all.indexOf(l);
              const on = selected.includes(i);
              const isSaved = savedKeys.includes(leadKey(l));
              return (
                <tr key={i} className={"border-b border-gray-100 " + (on ? "bg-blue-50/60" : "bg-white")}>
                  <td className="px-4 py-3.5">
                    <Checkbox state={on ? "on" : "off"} onClick={() => onToggle(i)} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm font-medium text-slate-900">{l.name}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <IcoStar c="h-3.5 w-3.5 text-amber-500" />
                      {l.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">{l.reviews}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-gray-500">{l.phone}</td>
                  <td className="px-4 py-3.5 text-gray-500">
                    {hasEmail(l.email) ? (
                      <a href={"mailto:" + l.email} className="block max-w-[180px] truncate text-blue-600" title={l.email}>
                        {l.email}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{l.area}</td>
                  <td className="px-4 py-3.5">
                    <Pill tone={l.leadType === "Website" ? "blue" : "amber"}>{l.leadType}</Pill>
                  </td>
                  <td className="px-4 py-3.5">
                    {l.website === "No website" ? (
                      <Pill tone="blue">No website</Pill>
                    ) : (
                      <span className="text-xs text-gray-500">Has website</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5">
                    <IcoPin c="h-4 w-4 text-blue-500" />
                  </td>
                  <td className="px-3 py-3.5">
                    <button onClick={() => onDownloadOne(l)} aria-label={`Download PDF for ${l.name}`}>
                      <IcoFile c="h-4 w-4 text-gray-400 hover:text-blue-600" />
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => onToggleSave(l)}
                      aria-label={isSaved ? "Remove from saved" : "Save lead"}
                      className={isSaved ? "text-blue-600" : "text-gray-400 hover:text-blue-600"}
                    >
                      <IcoBookmark c="h-4 w-4" on={isSaved} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {leads.length === 0 && empty}
        <div className="px-4 py-3 text-xs text-gray-500">
          Showing {leads.length} of {all.length} leads
        </div>
      </div>
    </>
  );
}

/* ======================= SELECTION BANNER ======================= */

function SelectionBanner({
  count,
  onDismiss,
  onDownload,
}: {
  count: number;
  onDismiss: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-between rounded-xl bg-blue-600 px-4 py-3.5 text-white">
      <button onClick={onDownload} className="flex items-center gap-2.5 text-sm font-medium">
        <IcoCheckCheck c="h-4 w-4" />
        <span>
          {count} selected <span className="font-normal text-blue-100">|</span>{" "}
          <span className="font-semibold">Download PDF</span>
        </span>
      </button>
      <button onClick={onDismiss} aria-label="Dismiss">
        <IcoX c="h-4 w-4 text-blue-100 transition-colors hover:text-white" />
      </button>
    </div>
  );
}

/* ======================= MAIN ======================= */

export default function LeadFinder() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [saved, setSaved] = useState<LeadRow[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [preset, setPreset] = useState(2);
  const [custom, setCustom] = useState<[number, number]>(DEFAULT_CUSTOM);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [area, setArea] = useState(0);
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [businessType, setBusinessType] = useState(TYPES[0]);
  const [minReviews, setMinReviews] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const cities = ["All " + country, ...COUNTRIES[country]];
  const [minR, maxR] = preset === 2 ? custom : RANGES[preset];
  const location = area > 0 ? `${cities[area]}, ${country}` : country;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  /* ---------- saved leads (localStorage) ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const savedKeys = saved.map(leadKey);

  const toggleSave = (lead: LeadRow) => {
    const k = leadKey(lead);
    const next = savedKeys.includes(k) ? saved.filter((s) => leadKey(s) !== k) : [...saved, lead];
    setSaved(next);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    showToast(savedKeys.includes(k) ? "Removed from saved" : "Lead saved");
  };

  /* ---------- list shown in table ---------- */
  const all = showSaved ? saved : leads;

  const toggle = (i: number) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i].sort((a, b) => a - b)));

  const filtered = all.filter((l) => {
    if (noWebsiteOnly && l.website !== "No website") return false;
    const q = query.trim().toLowerCase();
    if (q && !(l.name + " " + l.area + " " + l.phone + " " + (l.email ?? "")).toLowerCase().includes(q)) return false;
    return true;
  });

  const headerState: CheckboxState =
    selected.length === 0 ? "off" : selected.length === all.length ? "on" : "some";
  const toggleAll = () => setSelected(headerState === "on" ? [] : all.map((_, k) => k));

  /* ---------- search ---------- */
  const runSearch = async (o: { country?: string; area?: number } = {}) => {
    const c = o.country ?? country;
    const a = o.area ?? area;
    const cityName = a > 0 ? COUNTRIES[c][a - 1] : "";
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType,
          city: c,
          area: cityName,
          minRating: minR,
          maxRating: maxR,
          minReviews: Number(minReviews) || 0,
          noWebsiteOnly,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("Leads API error:", res.status, data);
        showToast("Search failed, console check karo");
        return;
      }
      setLeads(Array.isArray(data) ? data : data?.leads ?? []);
      setSelected([]);
      setBannerOpen(true);
      setShowSaved(false);
    } catch (err) {
      console.error("Leads fetch error:", err);
      showToast("Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCountryChange = (c: string) => {
    setCountry(c);
    setArea(0);
    runSearch({ country: c, area: 0 });
  };

  const handleAreaChange = (i: number) => {
    setArea(i);
    runSearch({ area: i });
  };

  const handleRangeChange = (lo: number, hi: number) => {
    setCustom([lo, hi]);
    setPreset(2);
  };

  const handleReset = () => {
    setPreset(2);
    setCustom(DEFAULT_CUSTOM);
    setArea(0);
    setCountry(DEFAULT_COUNTRY);
    setNoWebsiteOnly(false);
    setBusinessType(TYPES[0]);
    setMinReviews("");
  };

  /* ---------- export ---------- */
  const selectedLeads = selected.map((i) => all[i]).filter(Boolean) as LeadRow[];
  const exportRows = selectedLeads.length > 0 ? selectedLeads : filtered;

  const pdfOptions = {
    city: location,
    sample: false,
    filtersSummary: `${businessType} · ${location} · ${minR.toFixed(1)}-${maxR.toFixed(1)} rating · ${Number(minReviews) || 0}+ reviews`,
  };

  const handleDownloadPdf = () => downloadLeadReport(exportRows, pdfOptions);
  const handleDownloadOne = (lead: LeadRow) => downloadLeadReport([lead], pdfOptions);
  const handleExportCsv = () => exportLeadsCsv(exportRows);

  const handleCopyPhones = async () => {
    const phones = exportRows.map((l) => l.phone).filter((p) => p && p !== "-");
    if (phones.length === 0) {
      showToast("Koi phone number nahi mila");
      return;
    }
    const ok = await copyText(phones.join("\n"));
    showToast(ok ? `Copied ${phones.length} phone numbers` : "Copy nahi ho saka");
  };

  return (
    <>
      <Hero location={location} />

      <FilterCard
        preset={preset}
        onPresetChange={setPreset}
        minR={minR}
        maxR={maxR}
        onRangeChange={handleRangeChange}
        country={country}
        onCountryChange={handleCountryChange}
        cities={cities}
        area={area}
        onAreaChange={handleAreaChange}
        location={location}
        noWebsiteOnly={noWebsiteOnly}
        onToggleNoWebsite={() => setNoWebsiteOnly((v) => !v)}
        businessType={businessType}
        onBusinessTypeChange={setBusinessType}
        minReviews={minReviews}
        onMinReviewsChange={setMinReviews}
        onSearch={() => runSearch()}
        loading={loading}
        onReset={handleReset}
      />

      <StatsRow leads={leads} businessType={businessType} location={location} />

      <LeadsHeader
        count={filtered.length}
        savedCount={saved.length}
        showSaved={showSaved}
        onToggleSaved={() => {
          setShowSaved((v) => !v);
          setSelected([]);
        }}
      />
      <LeadsToolbar
        query={query}
        onQueryChange={setQuery}
        disabled={exportRows.length === 0}
        onExportCsv={handleExportCsv}
        onDownloadPdf={handleDownloadPdf}
        onCopyPhones={handleCopyPhones}
      />

      <LeadsList
        all={all}
        leads={filtered}
        selected={selected}
        onToggle={toggle}
        headerState={headerState}
        onToggleAll={toggleAll}
        onDownloadOne={handleDownloadOne}
        savedKeys={savedKeys}
        onToggleSave={toggleSave}
      />

      {bannerOpen && selected.length > 0 && (
        <SelectionBanner
          count={selected.length}
          onDismiss={() => setBannerOpen(false)}
          onDownload={handleDownloadPdf}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}