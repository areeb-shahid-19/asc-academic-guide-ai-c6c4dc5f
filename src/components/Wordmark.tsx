import blueAsset from "@/assets/wordmark-blue.asset.json";
import whiteAsset from "@/assets/wordmark-white.asset.json";

/**
 * Areeb Shahid Academy wordmark. Renders the user-provided logo image.
 * Pass `variant="white"` for dark backgrounds (header) or `"blue"` for
 * light backgrounds (home page / menu). Default is `"blue"`.
 *
 * The `className` prop still accepts height utilities like `h-10` — the
 * image scales proportionally.
 */
export function Wordmark({
  className = "",
  variant = "blue",
}: {
  className?: string;
  variant?: "blue" | "white";
}) {
  const src = variant === "white" ? whiteAsset.url : blueAsset.url;
  return (
    <img
      src={src}
      alt="Areeb Shahid Academy"
      className={`w-auto object-contain ${className}`}
      draggable={false}
    />
  );
}
