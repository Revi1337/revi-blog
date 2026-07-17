"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { m } from "motion/react"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

interface Slide {
  title: string
  imageUrl: string
}

const slides: Slide[] = [
  {
    title: "Architecting Low-Latency Microservices with Rust",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0gpWYHbw0jPIhiYjzybnGS42_5PzEfTHfaWMQJmygdrnHM4TZafa6VJfCHVPzkp6deZq0m8RD_5WNj3lqNwJv_Ty72rpkeZD3wXVZt-_Z8pU6UEO-NPRNNLJQBFTnTCIpZOa1F5u9SF8JxGgyaoqz0NEkEaBFehjPzW882yhHplhWKBZZKbUtI9m1ZFjxDHbSjKbJ8vFR8bD4RoNEguCTRGHQ576AEsfTkXDtKIsJYKFo6cLhOUV3",
  },
  {
    title: "Visualizing Raft Consensus in High-Traffic Environments",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDdRapr79O35FFEZUDKTkTL6XRAPOGgNh16hY6Q2PSblZNgXds1cFj3YY8nte9bQsbkeFHjKroJ2AdrRIX1yxooR4zpN4rzplAsUHjqSMtgepV4zCbylld1Wat8myHJgukCEhKUDOS60I7ZTKJy4k2TCb0hxUcWuABkSu5sHtQ7mEKKW6EeEno95cPExG23jbxJ49wQr752L5VaV09Ryt9a2oNT9iFjq7x4bdDxS7H4o34htwhCvqe4",
  },
  {
    title: "Zero-Downtime Migrations: The Hard Parts",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDicZ8Vhe25p3za4WFGumSmbqLZBtdkJTmAjcfo0eNCJ46zd8y9QnhUYUdoeAzhEWrubdUPxrvle8nOBlEVyzHK7m_usiYNExA9waAzjYq6imqN9N5N-xR52l0mIlJIxKnTZImCaIyezw8lzwvcrVc6YfThXDVyTg7KkeZf-wkeKzM1yJMwGYPd2xVTYWdWAK_TrNg1K1uaYoKA14re2YFqS3JE_qcSA43MLb2DMl1BgF9jURuks9XV",
  },
]

export function HeroCarousel() {
  const [api, setApi] = React.useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [autoplay] = React.useState(() =>
    Autoplay({ delay: 8000, stopOnInteraction: false })
  )

  React.useEffect(() => {
    if (!api) return
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap())
    // effect 본문에서 setState를 동기 호출하지 않도록 microtask로 한 틱 미룬다
    // (react-hooks/set-state-in-effect) — api는 이미 초기화돼 있어 값 자체는 안전하게 읽을 수 있음.
    queueMicrotask(onSelect)
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true }}
      plugins={[autoplay]}
      className="group relative h-[480px] w-full overflow-hidden rounded-xl bg-surface-container"
    >
      <CarouselContent className="h-full">
        {slides.map((slide, index) => (
          <CarouselItem key={slide.title} className="relative h-full">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${slide.imageUrl}')` }}
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-stack-lg">
              <m.h2
                key={index === selectedIndex ? slide.title : undefined}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl font-headline-xl text-headline-xl text-white"
              >
                {slide.title}
              </m.h2>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <button
        type="button"
        aria-label="이전 슬라이드"
        onClick={() => api?.scrollPrev()}
        className="absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded border border-outline-variant/30 bg-surface-bright/50 text-white opacity-0 backdrop-blur-md transition-all hover:bg-primary-fixed hover:text-black hover:opacity-100"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label="다음 슬라이드"
        onClick={() => api?.scrollNext()}
        className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded border border-outline-variant/30 bg-surface-bright/50 text-white opacity-0 backdrop-blur-md transition-all hover:bg-primary-fixed hover:text-black hover:opacity-100"
      >
        <ChevronRight className="size-5" />
      </button>

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`슬라이드 ${index + 1}로 이동`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-0.5 w-8 rounded-full transition-colors",
              index === selectedIndex ? "bg-primary-fixed" : "bg-on-surface-variant/30"
            )}
          />
        ))}
      </div>
    </Carousel>
  )
}
