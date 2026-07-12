import blueLogo from "@/assets/wordmark-blue.asset.json";
import whiteLogo from "@/assets/wordmark-white.asset.json";

/**
 * Areeb Shahid Academy wordmark. Uses the user-supplied transparent PNG logos
 * so letters render exactly as designed — no font drift, no cropping.
 */
export function Wordmark({
  className = "",
  variant = "blue",
}: {
  className?: string;
  variant?: "blue" | "white";
}) {
  const src = variant === "white" ? whiteLogo.url : blueLogo.url;
  return (
    <img
      src={src}
      alt="Areeb Shahid Academy"
      className={`w-auto max-w-full select-none object-contain ${className}`}
      draggable={false}
    />
  );
}
