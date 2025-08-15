"use client"

type CircularProgressProps = {
  value?: number // 0-100
  size?: number
  strokeWidth?: number
  trackColor?: string
  indicatorColor?: string
  label?: string
}

export default function CircularProgress({
  value = 72,
  size = 140,
  strokeWidth = 10,
  trackColor = "#E5E7EB",
  indicatorColor = "#28A745",
  label,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div style={{ width: size, height: size }} className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={indicatorColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-semibold text-[#1A1A1A]">{`${clamped}%`}</div>
        <div className="text-xs text-[#6B7280]">{label ?? "Aligned Today"}</div>
      </div>
    </div>
  )
}
