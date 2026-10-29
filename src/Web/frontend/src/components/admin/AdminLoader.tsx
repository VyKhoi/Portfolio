import { Loader2 } from "lucide-react"

interface AdminLoaderProps {
  label?: string
  rows?: number
  variant?: "cards" | "table" | "form" | "grid" | "split"
}

export function AdminLoader({
  label = "LOADING_DATA...",
  rows = 3,
  variant = "cards",
}: AdminLoaderProps) {
  return (
    <div className="space-y-6 font-mono animate-in fade-in duration-200">
      {/* Header status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 adm-text-accent">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm tracking-widest uppercase font-bold">{label}</span>
        </div>
        <div className="h-2 w-32 rounded-full overflow-hidden adm-elevated">
          <div className="h-full w-1/2 rounded-full animate-pulse" style={{ backgroundColor: "var(--adm-accent)" }} />
        </div>
      </div>

      {variant === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="p-6 adm-card rounded-lg space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 adm-skeleton rounded" />
                <div className="h-5 w-5 adm-skeleton rounded" />
              </div>
              <div className="h-9 w-20 adm-elevated rounded" />
            </div>
          ))}
        </div>
      )}

      {variant === "cards" && (
        <div className="grid gap-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="p-6 adm-card rounded-lg space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-56 adm-skeleton rounded" />
                  <div className="h-3 w-36 adm-elevated rounded" />
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-8 adm-elevated rounded" />
                  <div className="h-8 w-8 adm-elevated rounded" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 adm-elevated rounded" />
                <div className="h-6 w-20 adm-elevated rounded" />
                <div className="h-6 w-14 adm-elevated rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === "table" && (
        <div className="adm-card rounded-lg overflow-hidden animate-pulse">
          <div className="p-4 flex justify-between border-b adm-divider" style={{ backgroundColor: "var(--adm-bg-elevated)" }}>
            <div className="h-3 w-20 adm-skeleton rounded" />
            <div className="h-3 w-28 adm-skeleton rounded" />
            <div className="h-3 w-40 adm-skeleton rounded" />
            <div className="h-3 w-20 adm-skeleton rounded" />
          </div>
          <div className="divide-y adm-divider">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="h-5 w-5 adm-skeleton rounded-full" />
                <div className="space-y-2 w-40">
                  <div className="h-4 w-28 adm-skeleton rounded" />
                  <div className="h-3 w-36 adm-elevated rounded" />
                </div>
                <div className="h-4 w-64 adm-elevated rounded" />
                <div className="h-4 w-20 adm-elevated rounded" />
                <div className="h-8 w-20 adm-elevated rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "form" && (
        <div className="adm-card p-6 rounded-lg max-w-2xl space-y-4 animate-pulse">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 adm-elevated rounded" />
            <div className="h-12 adm-elevated rounded" />
          </div>
          <div className="h-28 adm-elevated rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 adm-elevated rounded" />
            <div className="h-12 adm-elevated rounded" />
          </div>
          <div className="h-10 w-44 adm-skeleton rounded ml-auto" />
        </div>
      )}
    </div>
  )
}

export function RefreshingBadge({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span className="adm-badge-accent font-mono">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      SYNCING...
    </span>
  )
}
