import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Sharp corners, geometric design
    const baseClasses = "inline-flex items-center justify-center text-sm font-bold tracking-widest uppercase transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group"
    
    const variants = {
      default: "bg-primary text-black hover:bg-primary-hover border border-primary",
      outline: "border border-border bg-transparent text-text-main hover:border-primary hover:text-primary",
      ghost: "hover:bg-surface hover:text-primary text-text-muted"
    }

    const sizes = {
      default: "h-12 px-6 py-2",
      sm: "h-10 px-4 text-xs",
      lg: "h-14 px-8 text-base",
      icon: "h-12 w-12",
    }

    return (
      <Comp
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center h-full w-full">{props.children}</span>
        {variant === 'outline' && (
          <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0 opacity-10" />
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }
