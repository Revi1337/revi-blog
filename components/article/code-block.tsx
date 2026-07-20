import { codeToHtml } from "shiki"

interface CodeBlockProps {
  filename: string
  language: string
  code: string
}

export async function CodeBlock({ filename, language, code }: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang: language,
    theme: "github-dark-default",
  })

  return (
    <div className="group relative my-8 overflow-hidden rounded border border-outline-variant/30 bg-surface-container-lowest p-5">
      <div className="absolute left-0 top-0 h-full w-1 bg-primary/50 dark:bg-primary-container/50" />
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-error/80" />
          <div className="size-2 rounded-full bg-secondary/80" />
          <div className="size-2 rounded-full bg-primary/80 dark:bg-primary-container/80" />
        </div>
        <span className="font-code-sm text-xs text-on-surface-variant/50">{filename}</span>
      </div>
      <div
        className="overflow-x-auto pt-2 font-code-sm text-primary leading-relaxed [&_pre]:bg-transparent! [&_pre]:whitespace-pre-wrap dark:text-primary-fixed-dim"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
