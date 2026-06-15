import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  clearable?: boolean
  onClear?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, clearable, onClear, ...props }, ref) => {
    const [showClear, setShowClear] = React.useState(false)

    const handleClear = () => {
      const input = ref as React.RefObject<HTMLInputElement>
      if (input?.current) {
        input.current.value = ""
        input.current.dispatchEvent(new Event("input", { bubbles: true }))
      }
      onClear?.()
      setShowClear(false)
    }

    React.useEffect(() => {
      setShowClear(clearable && !!props.value)
    }, [clearable, props.value])

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-10",
            clearable && showClear && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {clearable && showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

/**
 * Search input with icon
 */
const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        placeholder="Search..."
        icon={<Search className="h-4 w-4" />}
        {...props}
      />
    )
  }
)
SearchInput.displayName = "SearchInput"

export { Input, SearchInput }