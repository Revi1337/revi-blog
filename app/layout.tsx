import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import localFont from "next/font/local"

import { ThemeScript } from "@/components/theme/theme-script"
import { ThemeProvider } from "@/components/theme/theme-context"
import { NavBar } from "@/components/layout/nav-bar"
import { Footer } from "@/components/layout/footer"
import { MotionProvider } from "@/components/motion-provider"

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
  title: "Revi Blog",
  description: "Revi's engineering blog",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${pretendard.variable} min-h-screen font-body-md antialiased`}
      >
        <ThemeProvider>
          <MotionProvider>
            <NavBar />
            <main className="pt-24">{children}</main>
            <Footer />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
