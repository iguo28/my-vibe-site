import Image from "next/image";

/** Same tilt for every bean — matches your reference image */
const BEAN_TILT = 42;

const SIZES = {
  sm: { width: 11, height: 18 },
  md: { width: 14, height: 23 },
} as const;

export function CoffeeBeanIcon({
  filled,
  size = "md",
  className = "",
}: {
  filled: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const { width, height } = SIZES[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ transform: `rotate(${BEAN_TILT}deg)` }}
      aria-hidden
    >
      <Image
        src="/coffee-bean.png"
        alt=""
        width={width}
        height={height}
        className={`object-contain transition-opacity ${
          filled ? "opacity-100" : "opacity-[0.38]"
        }`}
        style={{
          filter: filled
            ? "saturate(1.2) contrast(1.05)"
            : "saturate(0.85) brightness(0.95)",
        }}
      />
    </span>
  );
}

/** Community average price as beans only (no numeric label) */
export function BeanAverageDisplay({
  average,
  count,
  size = "sm",
}: {
  average: number;
  count: number;
  size?: "sm" | "md";
}) {
  const filledCount = Math.round(average);

  return (
    <div
      className="flex items-center gap-1.5"
      title={`Community price · ${count} rating${count === 1 ? "" : "s"}`}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-latte">
        Price
      </span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <CoffeeBeanIcon key={i} filled={i <= filledCount} size={size} />
        ))}
      </div>
    </div>
  );
}
