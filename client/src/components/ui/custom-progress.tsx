import * as React from "react"
import { cn } from "@/lib/utils"

interface CustomProgressProps {
  value?: number
  className?: string
}

const CustomProgress = React.forwardRef<HTMLDivElement, CustomProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const percentage = Math.max(0, Math.min(100, value))
    
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
          className="h-full transition-all duration-300 ease-in-out"
          style={{ 
            width: `${percentage}%`,
            background: percentage === 0 
              ? 'hsl(207, 90%, 54%)' // Pure blue at 0%
              : percentage === 100 
                ? 'rgb(34, 197, 94)' // Pure green at 100%
                : `linear-gradient(to right, hsl(207, 90%, 54%) ${100 - percentage}%, rgb(34, 197, 94) ${percentage}%)`
          }}
        />
      </div>
    )
  }
)
CustomProgress.displayName = "CustomProgress"

export { CustomProgress }