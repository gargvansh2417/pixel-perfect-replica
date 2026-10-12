const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/85",
  secondary: "bg-surface text-foreground hover:bg-hover",
  warning: "bg-warning text-status-queued-fg hover:bg-warning/85",
  error: "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
} as const;

export function btn(variant: keyof typeof variants = "primary", size: "sm" | "xs" = "sm") {
  return `${base} ${variants[variant]} ${size === "xs" ? "px-2 py-1 text-caption" : "px-4 py-2 text-label"}`;
}
