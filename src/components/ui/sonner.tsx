"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      // Toasts already ship an icon and text; richColors adds the coloured
      // border and fill so state is never carried by colour alone.
      richColors
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",

          "--error-bg": "var(--color-destructive-tint)",
          "--error-border": "var(--color-destructive)",
          "--error-text": "var(--color-destructive-dark)",

          "--success-bg": "var(--color-success-tint)",
          "--success-border": "var(--color-success)",
          "--success-text": "var(--color-success)",

          // Ink, not warning — see the note in StatusMessage.tsx.
          "--warning-bg": "var(--color-warning-tint)",
          "--warning-border": "var(--color-warning)",
          "--warning-text": "var(--color-ink)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
