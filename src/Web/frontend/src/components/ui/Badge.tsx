import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  // Sharp borders, no rounding
  const baseClasses = "inline-flex items-center border px-3 py-1 text-xs font-bold font-mono transition-colors focus:outline-none uppercase tracking-widest"
  
  const variants = {
    default: "border-primary bg-primary/10 text-primary",
    secondary: "border-border bg-surface text-text-muted hover:border-text-muted transition-colors",
    outline: "text-text-muted border-border",
  }

  return (
    <div className={cn(baseClasses, variants[variant], className)} {...props} />
  )
}

export { Badge }
