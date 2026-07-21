import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import localFont from "next/font/local"
import { cookies } from "next/headers"

import { ThemeProvider } from "@/components/theme/theme-context"
import { THEME_COOKIE_KEY } from "@/components/theme/theme-constants"
import { NavBar } from "@/components/layout/nav-bar"
import { Footer } from "@/components/layout/footer"
import { MotionProvider } from "@/components/motion-provider"
import { searchIndex } from "@/lib/data/search"

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
const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://revi-blog.vercel.app"),
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
        className={`${inter.variable} ${jetbrainsMono.variable} ${pretendard.variable} min-h-screen font-body-md antialiased`}
      >
        <ThemeProvider initialIsDark={initialIsDark}>
          <MotionProvider>
            <NavBar searchIndex={searchIndex} />
            <main className="pt-24">{children}</main>
            <Footer />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
