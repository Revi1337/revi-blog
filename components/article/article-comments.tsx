"use client"

import dynamic from "next/dynamic"
import { MessageSquare } from "lucide-react"

import { useTheme } from "@/components/theme/theme-context"

const Giscus = dynamic(() => import("@giscus/react"), { ssr: false })

const GISCUS_REPO = "Revi1337/revi-blog-comments"
const GISCUS_REPO_ID = "R_kgDOTfKNMg"
const GISCUS_CATEGORY = "Announcements"
const GISCUS_CATEGORY_ID = "DIC_kwDOTfKNMs4DBqAj"

export function ArticleComments() {
  const { isDark } = useTheme()

  return (
    <div className="mt-12">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent dark:via-primary-container/40" />
      <div className="mb-4 mt-6 flex items-center gap-2 text-primary dark:text-primary-container">
        <MessageSquare className="size-4" />
        <h4 className="font-label-caps text-xs tracking-widest">Comments</h4>
      </div>
      <Giscus
        repo={GISCUS_REPO}
        repoId={GISCUS_REPO_ID}
        category={GISCUS_CATEGORY}
        categoryId={GISCUS_CATEGORY_ID}
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme={isDark ? "dark" : "light"}
        lang="ko"
        loading="lazy"
      />
    </div>
  )
}
