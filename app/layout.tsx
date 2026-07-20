import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"

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
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen font-body-md antialiased`}
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
