import type { Metadata } from "next";
import LeadFinder from "./components/lead-finder/LeadFinder";

export const metadata: Metadata = {
  title: "Lead Finder — Find businesses that need your services",
  description:
    "Discover local opportunities. Find businesses without websites or with weak reviews and turn them into your next clients.",
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <circle cx="12" cy="12" r="8" fill="none" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="12" r="2.5" fill="white" />
              </svg>
            </span>
            <span className="text-[15px] font-bold tracking-tight">Lead Finder</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
              Credits: 120
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-[11px] font-semibold text-gray-600">
              AK
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 pb-10 sm:px-6">
        <LeadFinder />
      </main>

      <footer className="pb-8 pt-6 text-center text-xs text-gray-400">
        Data from Google Places API
      </footer>
    </div>
  );
}