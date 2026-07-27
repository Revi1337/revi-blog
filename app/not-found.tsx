import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "404 - Page Not Found",
}

export default function NotFound() {
  return (
    <div className="absolute inset-x-0 bottom-0 top-[var(--header-offset)] mx-auto flex max-w-[1200px] flex-col items-center justify-center px-gutter text-center">
      <span className="font-code-sm text-[96px] leading-none font-bold text-primary dark:text-primary-fixed sm:text-[140px]">
        404
      </span>
      <h1 className="mt-6 font-headline-xl text-headline-xl text-on-surface">Page Not Found</h1>
      <p className="mt-4 max-w-md font-body-md text-body-md text-on-surface-variant">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-label-caps text-label-caps text-on-primary transition-all hover:brightness-110 active:scale-95 dark:bg-primary-fixed dark:text-background"
      >
        Back to Home
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
