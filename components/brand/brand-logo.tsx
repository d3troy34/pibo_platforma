import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

interface BrandLogoProps {
  href?: string
  compact?: boolean
  className?: string
  onDark?: boolean
  priority?: boolean
  suffix?: string
}

const logoAssets = {
  compact: { src: "/brand/pibo-mark.png", width: 100, height: 100 },
  wordmark: { src: "/brand/pibo-wordmark.png", width: 249, height: 100 },
} as const

export function BrandLogo({
  href,
  compact = false,
  className,
  onDark = false,
  priority = false,
  suffix,
}: BrandLogoProps) {
  const image = compact ? logoAssets.compact : logoAssets.wordmark

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-3 text-[2rem]",
        onDark && "rounded-xl bg-white px-3 py-2",
        className
      )}
    >
      <Image
        src={image.src}
        alt="Pibo"
        width={image.width}
        height={image.height}
        priority={priority}
        className={cn("object-contain", compact ? "h-[1em] w-[1em]" : "h-[1em] w-auto")}
      />
      {suffix && (
        <span
          className={cn(
            "border-l pl-3 text-xs font-semibold uppercase tracking-[0.18em]",
            onDark ? "border-ink/15 text-ink/60" : "border-border text-muted-foreground"
          )}
        >
          {suffix}
        </span>
      )}
    </span>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
