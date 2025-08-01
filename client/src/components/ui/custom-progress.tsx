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
        {/* Blue background bar (full width) */}
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: "100%" }}
        />
        {/* Green progress bar (grows from left to right) */}
        <div
          className="absolute top-0 left-0 h-full bg-green-600 transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
CustomProgress.displayName = "CustomProgress"

export { CustomProgress }