import type { CSSProperties } from "react";
const paths = {
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M22 21v-2a4 4 0 0 0-3-3.87 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M16 3a4 4 0 0 1 0 8",
  message:
    "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H3l2-5a8.5 8.5 0 1 1 16-3.5 M8 11h.01 M12 11h.01 M16 11h.01",
  clipboard: "M9 4H5v17h14V4h-4 M9 2h6v5H9z M8 12h8 M8 16h6",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z",
  search: "M21 21l-5-5 M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15",
  arrow: "M4 12h16 M14 6l6 6-6 6",
  bolt: "m13 2-9 12h7l-1 8 10-12h-7z",
  water: "M12 2S4 10 4 15a8 8 0 0 0 16 0c0-5-8-13-8-13 M8 15a4 4 0 0 0 4 4",
  sparkle:
    "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z M20 2v4 M18 4h4",
  paint: "M4 3h13v6H4z M17 6h4v7H11v8H8v-8",
  wrench: "M14 6a5 5 0 0 0-6 6L2 18l4 4 6-6a5 5 0 0 0 6-6l-4 2-3-3z",
  leaf: "M20 3C8 2 2 6 4 15s18 5 16-12z M3 21l12-12",
  book: "M12 5v16 M12 5C8 2 4 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-2-1-6-2-10 1",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  location:
    "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z",
  close: "m6 6 12 12 M6 18 18 6",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  help: "M9 8a3 3 0 0 1 6 0c0 3-3 2-3 5 M12 17h.01 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
  exit: "M9 3H3v18h6 M9 12h12 M16 7l5 5-5 5",
  shield: "m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6z M8 12l3 3 5-6",
  check: "m5 12 4 4L19 6",
  chevron: "m9 5 7 7-7 7",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2",
} as const;
export type IconName = keyof typeof paths;
export default function HomeIcon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
