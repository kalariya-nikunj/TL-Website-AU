import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-border bg-surface px-2.5 py-1 text-base text-ink transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-small file:font-medium file:text-ink placeholder:text-muted hover:border-muted disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-primary-tint disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-destructive-tint md:text-small",
        className
      )}
      {...props}
    />
  )
}

export { Input }
