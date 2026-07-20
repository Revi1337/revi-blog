"use client"

import * as React from "react"
import Link from "next/link"
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

export interface HeroSlide {
  slug: string
  title: string
  imageUrl: string
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
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
          <CarouselItem key={slide.slug} className="relative h-full">
            <Link href={`/article/${slide.slug}`} className="block h-full w-full">
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
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>

      <button
        type="button"
        aria-label="이전 슬라이드"
        onClick={() => api?.scrollPrev()}
        className="absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded border border-outline-variant/30 bg-surface-bright/50 text-white opacity-0 backdrop-blur-md transition-all hover:bg-primary hover:text-on-primary hover:opacity-100 dark:hover:bg-primary-fixed dark:hover:text-black"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label="다음 슬라이드"
        onClick={() => api?.scrollNext()}
        className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded border border-outline-variant/30 bg-surface-bright/50 text-white opacity-0 backdrop-blur-md transition-all hover:bg-primary hover:text-on-primary hover:opacity-100 dark:hover:bg-primary-fixed dark:hover:text-black"
      >
        <ChevronRight className="size-5" />
      </button>

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.slug}
            type="button"
            aria-label={`슬라이드 ${index + 1}로 이동`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-0.5 w-8 rounded-full transition-colors",
              index === selectedIndex
                ? "bg-primary dark:bg-primary-fixed"
                : "bg-on-surface-variant/30"
            )}
          />
        ))}
      </div>
    </Carousel>
  )
}
