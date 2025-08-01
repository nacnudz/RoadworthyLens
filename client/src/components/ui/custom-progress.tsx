import * as React from "react"
import { cn } from "@/lib/utils"

interface CustomProgressProps {
  value?: number
  className?: string
}

const CustomProgress = React.forwardRef<HTMLDivElement, CustomProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const percentage = Math.max(0, Math.min(100, value))
    
    // Use blue for 0-99%, green only for 100%
    const progressColor = percentage === 100 ? 'rgb(34, 197, 94)' : 'hsl(207, 90%, 54%)'
    
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
            backgroundColor: progressColor
          }}
        />
      </div>
    )
  }
)
CustomProgress.displayName = "CustomProgress"

export { CustomProgress }