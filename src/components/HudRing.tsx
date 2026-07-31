/** Arc-reactor style HUD emblem */
export function HudRing({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-hud-pulse`}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="24" cy="24" r="22" stroke="rgba(34,211,238,0.25)" strokeWidth="1" />
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="rgba(34,211,238,0.5)"
        strokeWidth="1"
        strokeDasharray="4 6"
        className="origin-center animate-hud-spin"
        style={{ transformOrigin: "24px 24px" }}
      />
      <circle cx="24" cy="24" r="10" stroke="#22d3ee" strokeWidth="1.5" opacity="0.8" />
      <circle cx="24" cy="24" r="4" fill="#22d3ee" opacity="0.9">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      </circle>
      <line x1="24" y1="2" x2="24" y2="8" stroke="#22d3ee" strokeWidth="1" opacity="0.6" />
      <line x1="24" y1="40" x2="24" y2="46" stroke="#22d3ee" strokeWidth="1" opacity="0.6" />
      <line x1="2" y1="24" x2="8" y2="24" stroke="#22d3ee" strokeWidth="1" opacity="0.6" />
      <line x1="40" y1="24" x2="46" y2="24" stroke="#22d3ee" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
