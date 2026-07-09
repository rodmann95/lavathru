interface LogoProps {
  size?: number;
  showText?: boolean;
  variant?: "light" | "dark";
}

/**
 * Lava Thru logo — pinwheel/flower mark inspired by the storefront signage.
 */
export function Logo({ size = 36, showText = true, variant = "light" }: LogoProps) {
  const textColor = variant === "light" ? "text-white" : "text-primary";
  return (
    <div className="flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Lava Thru"
      >
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx="32"
            cy="16"
            rx="7"
            ry="12"
            fill="var(--color-brand)"
            transform={`rotate(${deg} 32 32)`}
          />
        ))}
        <circle cx="32" cy="32" r="5" fill="white" />
      </svg>
      {showText && (
        <div className="leading-none">
          <div className={`text-lg font-extrabold tracking-tight ${textColor}`}>Lava Thru</div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-brand">CAR WASH</div>
        </div>
      )}
    </div>
  );
}
