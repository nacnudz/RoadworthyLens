import * as React from "react"
import { cn } from "@/lib/utils"

interface CustomProgressProps {
  value?: number
  className?: string
}

const CustomProgress = React.forwardRef<HTMLDivElement, CustomProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const isComplete = value === 100
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out",
            isComplete ? "bg-green-600" : "bg-primary"
          )}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    )
  }
)
CustomProgress.displayName = "CustomProgress"

export { CustomProgress }