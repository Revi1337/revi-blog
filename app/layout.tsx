import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import localFont from "next/font/local"

import { ThemeProvider } from "@/components/theme/theme-context"
import { THEME_COOKIE_KEY, THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/components/theme/theme-constants"
import { NavBar } from "@/components/layout/nav-bar"
import { Footer } from "@/components/layout/footer"
import { RouteScrollReset } from "@/components/layout/route-scroll-reset"
import { MotionProvider } from "@/components/motion-provider"
import { searchIndex } from "@/lib/data/search"
import { DEFAULT_WEBSITE_OG_IMAGE } from "@/lib/data/types"
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site-config"

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
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  // revi-blog.vercel.app(Vercel 기본 도메인)이 CNAME 대상으로 계속 살아있어 커스텀 도메인과
  // 동일한 콘텐츠를 그대로 서빙함 — canonical로 SITE_URL을 명시해 두 호스트가 별개의 중복
  // 콘텐츠로 인덱싱되지 않고 blog.revi1337.com으로 신호가 모이도록 함
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/images/favicon.ico",
  },
  openGraph: {
    type: "website",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    url: SITE_URL,
    images: [DEFAULT_WEBSITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
  },
  verification: {
    google: "pVqcO9F2o2vERPP0_14xhPTiC_sCUt03sMq0USSr_xc",
    other: {
      "naver-site-verification": "511271574fd60ff41fe7eeb0125f2888685ddf4e",
      "msvalidate.01": "80EDC70E6AFA9AFE8914716474BAAA9D",
    },
  },
}

// viewportFit: "cover"가 없으면 iOS Safari가 노치/다이나믹 아일랜드 아래 safe area를 페이지가
// 아예 그릴 수 없는 영역으로 취급해(env(safe-area-inset-top)이 0으로 고정) 그 자리를 브라우저
// 자체 색으로 채운다 — NavBar의 backdrop-blur 글래스 배경이 그 경계에서 뚝 끊겨 보이는 원인.
// cover로 바꿔야 페이지가 그 영역까지 실제로 그릴 수 있게 되고, NavBar가 padding-top으로
// env(safe-area-inset-top)만큼 확보해 블러 배경을 노치 아래까지 이어지게 할 수 있다.
//
// themeColor: iOS Safari가 노치/상태바 색을 결정할 때 페이지 배경을 실시간으로 다시 샘플링하지
// 않고 이 <meta name="theme-color"> 값을 참조한다 — 다크모드 토글이 CSS class만 바꾸는 방식(
// prefers-color-scheme과 무관한 수동 토글)이라 Safari가 그 변화를 감지할 방법이 없어, 노치
// 영역이 항상 SSR 기본값인 다크로 고정돼 보였다. 여기 정적으로 넣는 값은 서버가 항상 "dark"로
// 렌더링하는 SSR 기본값과 맞춰둔 초기값일 뿐이고, 실제 라이트/다크 전환은 THEME_INIT_SCRIPT와
// theme-context.tsx의 toggleTheme이 이 meta 태그의 content를 직접 갱신해 처리한다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: THEME_COLOR_DARK,
}

// 다크모드가 기본값이므로 서버는 항상 "dark" 클래스로 렌더링한다 — 라이트 모드 사용자는 아래
// 인라인 스크립트가 hydration 전에 쿠키를 읽어 "dark"를 제거해준다. 예전에는 이 판단을 서버에서
// cookies()로 미리 읽어 렌더링했는데, 그러면 쿠키를 참조한다는 이유만으로 Next가 이 레이아웃 아래
// 모든 라우트(/, /article/[slug], /bookmark)를 통째로 dynamic 렌더링 대상으로 강제 전환시켰다.
// 그 결과 정적으로 미리 구워둘 수 있었던 페이지들이 요청마다 서버리스 함수를 새로 실행하게 됐고,
// Next의 자동 링크 prefetch(화면에 보이는 카드/네비 링크마다 실행)까지 겹치면서 홈페이지 진입 한 번에
// 수십 개의 서버리스 함수 호출이 동시에 몰려 반응이 느려지고 간헐적으로 503까지 발생했다(Vercel
// 프로덕션에서 실측). 테마 판단을 클라이언트(쿠키를 읽는 인라인 스크립트)로 옮기면 cookies()가
// 완전히 사라져 이 라우트들이 다시 정적으로 빌드되고, prefetch도 진짜 함수 호출이 아닌 CDN 캐시
// 히트가 된다.
// "dark" 클래스 제거뿐 아니라 <meta name="theme-color">의 content도 같이 맞춰야 한다 — 이걸
// 빠뜨리면 라이트 모드 사용자가 처음 페이지를 열었을 때 노치 영역이 SSR 기본값인 다크색으로
// 고정된 채 시작된다(theme-context.tsx의 toggleTheme 주석 참고).
const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE_KEY}=([^;]*)/);if(m&&decodeURIComponent(m[1])==="light"){document.documentElement.classList.remove("dark");var t=document.querySelector('meta[name="theme-color"]');if(t)t.setAttribute("content","${THEME_COLOR_LIGHT}")}}catch(e){}})()`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // 아래 인라인 스크립트가 hydration 전에 className을 직접 고쳐써서, 실제 사용자가 라이트
  // 모드면 서버가 보낸 "dark"와 React가 기대하는 값이 어긋난다 — React는 이 값을 되돌리지
  // 않지만(className이 정적 리터럴이라 재조정 대상이 아님) 콘솔에 hydration mismatch 에러를
  // 띄우므로, 의도된 어긋남임을 명시해 억제한다.
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${suit.variable} ${pretendard.variable} flex min-h-screen flex-col font-body-md antialiased`}
      >
        {/* body의 첫 자식이라 하이드레이션/페인트보다 먼저 동기 실행되며, 이 시점에 이미 파싱된
         * document.documentElement(<html>)의 클래스를 고쳐도 화면 깜빡임 없이 반영된다. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeProvider>
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
