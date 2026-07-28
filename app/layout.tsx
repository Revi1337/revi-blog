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

/** 헤딩 전용 폰트 — Inter(라틴)+SUIT(한글)를 한 헤딩에 섞으면(예: "Python 코드") 같은 font-weight를
 * 줘도 서체 디자인 차이로 굵기가 달라 보인다. Pretendard는 라틴 글리프를 Apple 계열 산세리프에 맞춰
 * 디자인해 한글과 섞여도 자연스러워서 헤딩(headline-xl/lg/lg-mobile)에서만 전체 교체로 사용한다.
 * 실사용 굵기(600/700)만 SUIT와 동일한 방식으로 static woff2 자체 호스팅 — 가변 폰트 npm 의존성 없음 */
const pretendard = localFont({
  src: [
    { path: "../public/fonts/pretendard/Pretendard-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/pretendard/Pretendard-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pretendard",
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
        className={`${inter.variable} ${jetbrainsMono.variable} ${suit.variable} ${pretendard.variable} flex min-h-screen flex-col font-body-md antialiased`}
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
