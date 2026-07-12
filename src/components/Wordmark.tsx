/**
 * Transparent text-only Areeb Shahid Academy wordmark.
 * This intentionally does not render the uploaded JPG background, so the logo
 * sits cleanly on Persian Blue headers and white pages.
 */
export function Wordmark({
  className = "",
  variant = "blue",
}: {
  className?: string;
  variant?: "blue" | "white";
}) {
  const colorClass = variant === "white" ? "text-white" : "text-[color:var(--persian-blue)]";

  return (
    <div
      aria-label="Areeb Shahid Academy"
      role="img"
      className={`flex w-auto select-none flex-col items-center justify-center leading-none ${colorClass} ${className}`}
    >
      <span className="font-crest text-[1.65em] font-bold uppercase leading-none">
        Areeb Shahid
      </span>
      <span className="mt-[0.16em] flex w-full items-center gap-[0.42em]">
        <span className="h-[0.12em] flex-1 bg-current" aria-hidden />
        <span className="font-crest text-[1em] font-semibold uppercase leading-none">Academy</span>
        <span className="h-[0.12em] flex-1 bg-current" aria-hidden />
      </span>
    </div>
  );
}
