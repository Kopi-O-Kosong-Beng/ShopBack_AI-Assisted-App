/**
 * The mark: a cashback return-loop that resolves into a to-do checkmark — one
 * continuous stroke, so "money coming back" and "task done" are the same gesture.
 * `animated` draws the stroke on once, used on the sign-in screen.
 */
export default function Logo({
  size = 40,
  animated = false,
}: {
  size?: number
  animated?: boolean
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        role="img"
        aria-label="ShopBack To-Do"
        className="drop-shadow-sm"
      >
        <defs>
          <linearGradient id="sb-logo-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97a4d" />
            <stop offset="55%" stopColor="#e8532f" />
            <stop offset="100%" stopColor="#c62f14" />
          </linearGradient>
          <linearGradient id="sb-logo-shine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="48" height="48" rx="13" fill="url(#sb-logo-bg)" />
        <path d="M0 13a13 13 0 0 1 13-13h22a13 13 0 0 1 13 13v9H0Z" fill="url(#sb-logo-shine)" />

        {/* the cashback loop returning into the tick */}
        <path
          d="M34.5 17.5a12 12 0 1 0 2.2 9.4"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.55"
          strokeWidth="3.2"
          strokeLinecap="round"
          className={animated ? 'sb-logo-loop' : undefined}
        />
        <path
          d="M11 25 L20 34 L33.5 15.5"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animated ? 'sb-logo-tick' : undefined}
        />
        {/* arrowhead: the "back" in cashback, and the climb in XP */}
        <path
          d="M41 8.5 L39.5 21.5 L28.5 15 Z"
          fill="#fff"
          className={animated ? 'sb-logo-head' : undefined}
        />
      </svg>
    </span>
  )
}
