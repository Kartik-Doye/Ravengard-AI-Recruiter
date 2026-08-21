type PaperScrunchOverlayProps = {
  strong?: boolean;
  className?: string;
};

export function PaperScrunchOverlay({
  strong = false,
  className = "",
}: PaperScrunchOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${
        strong ? "paper-scrunch-overlay--strong" : "paper-scrunch-overlay"
      } ${className}`}
    />
  );
}
