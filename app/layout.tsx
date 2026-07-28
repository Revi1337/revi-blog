import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import localFont from "next/font/local"
import { cookies } from "next/headers"

import { ThemeProvider } from "@/components/theme/theme-context"
import { THEME_COOKIE_KEY } from "@/components/theme/theme-constants"
import { NavBar } from "@/components/layout/nav-bar"
import { Footer } from "@/components/layout/footer"
import { RouteScrollReset } from "@/components/layout/route-scroll-reset"
import { MotionProvider } from "@/components/motion-provider"
import { searchIndex } from "@/lib/data/search"
import { SITE_URL } from "@/lib/site-config"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

/** Inter/JetBrains Mono는 한글 글리프가 없어 한글 텍스트가 임의의 시스템 폰트로 폴백되던 문제를
 * 해결하기 위한 한글 전용 폴백 폰트 — 라틴 문자는 여전히 Inter/JetBrains Mono가 우선 매칭된다 */
const suit = localFont({
  src: [
    { path: "../public/fonts/suit/SUIT-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/suit/SUIT-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/suit/SUIT-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/suit/SUIT-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-suit",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Revi - Blog",
  description: "Revi's engineering blog",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const initialIsDark = cookieStore.get(THEME_COOKIE_KEY)?.value !== "light"

  return (
    <html lang="en" className={initialIsDark ? "dark" : undefined}>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${suit.variable} flex min-h-screen flex-col font-body-md antialiased`}
      >
        <ThemeProvider initialIsDark={initialIsDark}>
          <MotionProvider>
            <RouteScrollReset />
            <NavBar searchIndex={searchIndex} />
            <main className="relative flex-1 pt-24">{children}</main>
            <Footer />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
