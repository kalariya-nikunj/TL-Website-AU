import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-base text-ink transition-colors placeholder:text-muted hover:border-muted disabled:cursor-not-allowed disabled:bg-primary-tint disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-destructive-tint md:text-small",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
