export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-outline-variant bg-surface-container-lowest py-stack-lg print:hidden">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-stack-lg px-gutter md:flex-row">
        <div className="font-code-sm text-code-sm text-on-surface-variant">Revi Blog</div>
        <div className="font-code-sm text-code-sm text-on-surface-variant">
          © {year} Revi. All rights reserved.
        </div>
        <div className="flex gap-4">
          {/* <a
            className="font-code-sm text-code-sm text-on-surface-variant transition-colors hover:text-primary dark:hover:text-primary-fixed-dim"
            href="https://me.revi1337.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            About
          </a> */}
          <a
            className="font-code-sm text-code-sm text-on-surface-variant transition-colors hover:text-primary dark:hover:text-primary-fixed-dim"
            href="https://github.com/Revi1337"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
