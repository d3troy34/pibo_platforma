import Link from "next/link"

import { cn } from "@/lib/utils"

interface BrandLogoProps {
  href?: string
  compact?: boolean
  className?: string
  suffix?: string
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-label="Pibo"
      className="relative inline-flex items-baseline font-black tracking-[-0.09em] text-ink"
    >
      {compact ? "p" : "pibo"}
      <span className="ml-1 inline-block h-[0.22em] w-[0.22em] rounded-full bg-pink" />
      {!compact && (
        <span className="absolute left-[1.08em] top-[-0.04em] h-[0.18em] w-[0.18em] rounded-full bg-indigo" />
      )}
    </span>
  )
}

export function BrandLogo({
  href,
  compact = false,
  className,
  suffix,
}: BrandLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-3 text-[2rem]", className)}>
      <LogoMark compact={compact} />
      {suffix && (
        <span className="border-l border-border pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {suffix}
        </span>
      )}
    </span>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
