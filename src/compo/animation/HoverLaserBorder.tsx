interface HoverLaserBorderProps {
  rx?: number;
  ry?: number;
  strokeWidth?: number;
}

export default function HoverLaserBorder({
  rx = 12,
  ry = 12,
  strokeWidth = 2,
}: HoverLaserBorderProps) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <rect
        x="1"
        y="1"
        width="calc(100% - 2px)"
        height="calc(100% - 2px)"
        fill="none"
        rx={rx}
        ry={ry}
        pathLength="100"
        stroke="var(--color-primary, #3b82f6)"
        strokeWidth={strokeWidth}
        strokeDasharray="25 75"
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-[strokeWalk_4s_linear_infinite]"
      />
    </svg>
  );
}
