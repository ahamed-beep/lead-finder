export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <circle cx="12" cy="12" r="8" fill="none" stroke="white" strokeWidth="2" />
              <circle cx="12" cy="12" r="2.5" fill="white" />
            </svg>
          </span>
          <span className="text-[15px] font-bold tracking-tight text-slate-900">Lead Finder</span>
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
  );
}