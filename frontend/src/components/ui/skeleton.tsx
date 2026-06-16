import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text" | "card"
}

function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse-soft bg-muted/60 dark:bg-muted/40",
        {
          "rounded-full": variant === "circular",
          "rounded h-4": variant === "text",
          "rounded-lg": variant === "card" || variant === "default",
        },
        className
      )}
      {...props}
    />
  )
}

function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 space-y-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-1/3 h-4" />
          <Skeleton variant="text" className="w-1/2 h-3" />
        </div>
      </div>
      <Skeleton variant="text" className="w-full h-20" />
    </div>
  )
}

function SkeletonChatMessage({ className, isUser = false, ...props }: SkeletonProps & { isUser?: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        isUser ? "ml-auto justify-end" : "mr-auto justify-start",
        className
      )}
      {...props}
    >
      {!isUser && <Skeleton variant="circular" className="h-8 w-8" />}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 space-y-2",
          isUser
            ? "bg-primary/10 rounded-br-md"
            : "bg-muted/50 rounded-bl-md"
        )}
      >
        <Skeleton variant="text" className="w-48 h-4" />
        <Skeleton variant="text" className="w-32 h-4" />
      </div>
      {isUser && <Skeleton variant="circular" className="h-8 w-8" />}
    </div>
  )
}

function SkeletonDocument({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 space-y-3",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" className="h-10 w-10" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-3/4 h-4" />
          <div className="flex gap-2">
            <Skeleton variant="text" className="w-16 h-3" />
            <Skeleton variant="text" className="w-20 h-3" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton variant="text" className="w-14 h-5 rounded-full" />
        <Skeleton variant="text" className="w-14 h-5 rounded-full" />
      </div>
    </div>
  )
}

function SkeletonList({
  count = 3,
  className,
  ...props
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="card" className="h-24" />
      ))}
    </div>
  )
}

function SkeletonInput({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex h-10 items-center rounded-md border border-input bg-background px-3 py-2",
        className
      )}
      {...props}
    >
      <Skeleton variant="text" className="w-full h-4" />
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonChatMessage,
  SkeletonDocument,
  SkeletonList,
  SkeletonInput,
}