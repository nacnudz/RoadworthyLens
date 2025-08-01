import * as React from "react"
import { cn } from "@/lib/utils"

interface CustomProgressProps {
  value?: number
  className?: string
}

const CustomProgress = React.forwardRef<HTMLDivElement, CustomProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    // Calculate color based on progress percentage
    const getProgressColor = (percentage: number) => {
      if (percentage === 0) return "bg-primary" // Blue at 0%
      if (percentage === 100) return "bg-green-600" // Green at 100%
      // Gradient between blue and green for intermediate values
      const greenIntensity = percentage / 100
      const blueIntensity = 1 - greenIntensity
      return `bg-gradient-to-r from-primary to-green-600`
    }
    
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
            value === 100 ? "bg-green-600" : value === 0 ? "bg-primary" : "bg-gradient-to-r from-primary to-green-600"
          )}
          style={{ 
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: value > 0 && value < 100 
              ? `linear-gradient(to right, hsl(207, 90%, 54%), rgb(34, 197, 94) ${value}%)`
              : undefined
          }}
        />
      </div>
    )
  }
)
CustomProgress.displayName = "CustomProgress"

export { CustomProgress }