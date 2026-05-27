type Props = {
  /** Nav bar — icon only */
  compact?: boolean;
  /** Home hero — larger with tagline space */
  hero?: boolean;
  className?: string;
};

export function CafeLogo({ compact, hero, className = "" }: Props) {
  const iconSize = compact ? "h-9 w-9" : hero ? "h-20 w-20 sm:h-24 sm:w-24" : "h-12 w-12";

  return (
    <div
      className={`inline-flex shrink-0 items-center gap-3 ${className}`}
      aria-hidden={compact}
    >
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSize} drop-shadow-sm`}
        role={compact ? "img" : undefined}
        aria-label={compact ? "Cafe Connect" : undefined}
      >
        {/* Steam swirls */}
        <path
          d="M28 18c0-6 2-10 4-14M40 14c0-8 2-12 4-18M52 18c0-6 2-10 4-14"
          stroke="#c4a574"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M30 12c2-4 5-6 8-6M42 8c3-5 7-7 11-5"
          stroke="#8b6f47"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Mug */}
        <path
          d="M18 32h36l-3 32c-.4 4-3.6 7-7.5 7h-15c-3.9 0-7.1-3-7.5-7L18 32z"
          fill="#faf6f1"
          stroke="#2c1810"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M16 32h40"
          stroke="#2c1810"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M22 38h28v4c0 0-2 2-6 2h-16c-4 0-6-2-6-2v-4z"
          fill="#5c4033"
          opacity="0.85"
        />

        {/* Handle */}
        <path
          d="M54 36c8 0 14 6 14 14s-6 14-14 14"
          stroke="#2c1810"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheeky smile */}
        <path
          d="M32 52 Q40 58 48 52"
          stroke="#c4a574"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="33" cy="46" r="1.5" fill="#2c1810" />
        <circle cx="47" cy="46" r="1.5" fill="#2c1810" />

        {/* Beans at base */}
        <g transform="translate(24 62) rotate(-20)">
          <ellipse
            cx="6"
            cy="4"
            rx="6"
            ry="3.5"
            fill="#4a3228"
            stroke="#2c1810"
            strokeWidth="1"
          />
          <path
            d="M6 2 Q4 4 6 6 Q8 4 6 2"
            stroke="#2c1810"
            strokeWidth="0.8"
            fill="none"
          />
        </g>
        <g transform="translate(48 64) rotate(15)">
          <ellipse
            cx="6"
            cy="4"
            rx="6"
            ry="3.5"
            fill="#4a3228"
            stroke="#2c1810"
            strokeWidth="1"
          />
          <path
            d="M6 2 Q4 4 6 6 Q8 4 6 2"
            stroke="#2c1810"
            strokeWidth="0.8"
            fill="none"
          />
        </g>

        {/* Little heart in the steam */}
        <path
          d="M38 4c0-2 1.5-3 3-1.5 1.5-1.5 3 1.5 3 1.5 1.5-3 3-1.5C39.5 1 38 4 38 4z"
          fill="#c4a574"
          opacity="0.75"
        />
      </svg>
    </div>
  );
}
