import { cn } from "@/lib/utils";

/** Logo mark: light-grey circle, black vertical bar, condensed wordmark. */
export function LogoMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Startup News Room"
    >
      <circle cx="32" cy="32" r="32" fill="#D9D9D9" />
      <rect x="14" y="17" width="4" height="30" fill="#0A0A0A" />
      <g
        fontFamily="'Barlow Condensed','Arial Narrow',sans-serif"
        fontWeight="700"
        fill="#0A0A0A"
        fontSize="10.5"
      >
        <text x="21" y="26">
          STARTUP
        </text>
        <text x="21" y="36">
          NEWS
        </text>
        <text x="21" y="46">
          ROOM
        </text>
      </g>
    </svg>
  );
}
