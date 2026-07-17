import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed",
  {
    variants: {
      variant: {
        default: "bg-primary-container text-on-primary-container hover:brightness-110 active:scale-95",
        outline:
          "border border-outline-variant/30 bg-surface-bright/50 text-white backdrop-blur-md hover:bg-primary-fixed hover:text-black",
        ghost: "hover:bg-surface-container-highest/50 hover:text-primary-fixed",
      },
      size: {
        default: "h-10 px-6 py-2",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
