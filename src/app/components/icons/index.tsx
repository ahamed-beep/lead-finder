import type { ReactNode } from "react";

function Ico({
  className,
  children,
  fill = "none",
}: {
  className?: string | undefined;
  children: ReactNode;
  fill?: string;
}) {
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

export const IcoSearch = ({ c }: P) => (
  <Ico className={c}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Ico>
);
export const IcoChevron = ({ c }: P) => (
  <Ico className={c}>
    <polyline points="6 9 12 15 18 9" />
  </Ico>
);
export const IcoPin = ({ c }: P) => (
  <Ico className={c}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Ico>
);
export const IcoStar = ({ c }: P) => (
  <Ico className={c} fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Ico>
);
export const IcoSliders = ({ c }: P) => (
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
export const IcoBuilding = ({ c }: P) => (
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
export const IcoGlobe = ({ c }: P) => (
  <Ico className={c}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </Ico>
);
export const IcoPhone = ({ c }: P) => (
  <Ico className={c}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </Ico>
);
export const IcoDownload = ({ c }: P) => (
  <Ico className={c}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Ico>
);
export const IcoFile = ({ c }: P) => (
  <Ico className={c}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </Ico>
);
export const IcoCopy = ({ c }: P) => (
  <Ico className={c}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Ico>
);
export const IcoBookmark = ({ c }: P) => (
  <Ico className={c}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </Ico>
);
export const IcoCheck = ({ c }: P) => (
  <Ico className={c}>
    <polyline points="20 6 9 17 4 12" />
  </Ico>
);
export const IcoCheckCheck = ({ c }: P) => (
  <Ico className={c}>
    <path d="M18 6 7 17l-5-5" />
    <path d="m22 10-7.5 7.5L13 16" />
  </Ico>
);
export const IcoX = ({ c }: P) => (
  <Ico className={c}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Ico>
);
export const IcoMinus = ({ c }: P) => (
  <Ico className={c}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </Ico>
);
export const IcoInfo = ({ c }: P) => (
  <Ico className={c}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </Ico>
);
export const IcoSort = ({ c }: P) => (
  <Ico className={c}>
    <path d="m3 16 4 4 4-4" />
    <path d="M7 20V4" />
    <path d="M21 8l-4-4-4 4" />
    <path d="M17 4v16" />
  </Ico>
);
export const IcoArrowUp = ({ c }: P) => (
  <Ico className={c}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </Ico>
);