/**
 * SVG wordmark for Areeb Shahid Academy.
 *
 * Rendered as vector text so letters are always crisp — no image artifacts,
 * no distorted "H" / "B" from AI-generated PNGs. Color follows `currentColor`
 * so we can invert it (white in the header, Persian Blue on the home page /
 * menu) with a simple text-color utility.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 720 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Areeb Shahid Academy"
      role="img"
      className={className}
      style={{ color: "currentColor" }}
    >
      {/* AREEB SHAHID */}
      <text
        x="360"
        y="88"
        textAnchor="middle"
        fill="currentColor"
        style={{
          fontFamily: "'Cinzel', 'Trajan Pro', 'Times New Roman', serif",
          fontWeight: 700,
          fontSize: 72,
          letterSpacing: 6,
        }}
      >
        AREEB SHAHID
      </text>

      {/* Decorative tapered lines flanking ACADEMY */}
      <g fill="currentColor">
        <polygon points="70,152 260,148 260,156 70,156" />
        <polygon points="460,148 650,152 650,156 460,156" />
      </g>

      {/* ACADEMY */}
      <text
        x="360"
        y="168"
        textAnchor="middle"
        fill="currentColor"
        style={{
          fontFamily: "'Cinzel', 'Trajan Pro', 'Times New Roman', serif",
          fontWeight: 600,
          fontSize: 44,
          letterSpacing: 14,
        }}
      >
        ACADEMY
      </text>
    </svg>
  );
}
