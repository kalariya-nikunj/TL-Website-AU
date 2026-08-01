import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // No `outline-none` here: the one focus treatment in globals.css owns the
  // focus ring for every interactive element on the site.
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-small font-medium whitespace-nowrap transition-colors select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Maroon ground, white text — the workhorse.
        default: "bg-primary text-surface hover:bg-primary-mid",
        // Lime ground, near-black maroon text — the primary CTA. Used sparingly.
        accent: "bg-accent text-primary-dark hover:bg-accent/85",
        outline:
          "border-border bg-surface text-ink hover:bg-primary-tint hover:text-primary aria-expanded:bg-primary-tint aria-expanded:text-primary",
        secondary:
          "bg-primary-tint text-primary hover:bg-primary-tint/70 aria-expanded:bg-primary-tint aria-expanded:text-primary",
        ghost:
          "text-ink hover:bg-primary-tint hover:text-primary aria-expanded:bg-primary-tint aria-expanded:text-primary",
        // Errors and destructive actions only — never decorative. The border
        // carries the state alongside the fill so it does not read as colour
        // alone, and hover commits to the solid red.
        destructive:
          "border-destructive bg-destructive-tint text-destructive-dark hover:bg-destructive hover:text-surface",
        link: "text-primary underline-offset-4 hover:underline hover:decoration-accent-dark hover:decoration-2",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-lg px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-lg px-2.5 text-small has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-lg",
        "icon-lg": "size-9",
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
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
