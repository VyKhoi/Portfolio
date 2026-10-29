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
        <div className="flex items-center space-x-3 text-[#DEFF9A]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm tracking-widest uppercase">{label}</span>
        </div>
        <div className="h-2 w-32 bg-[#18181C] rounded-full overflow-hidden border border-[#27272A]">
          <div className="h-full w-1/2 bg-[#DEFF9A] rounded-full animate-pulse" />
        </div>
      </div>

      {variant === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="p-6 bg-[#121215] border border-[#27272A] rounded-lg space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 bg-[#27272A] rounded" />
                <div className="h-5 w-5 bg-[#27272A] rounded" />
              </div>
              <div className="h-9 w-20 bg-[#18181C] border border-[#27272A] rounded" />
            </div>
          ))}
        </div>
      )}

      {variant === "cards" && (
        <div className="grid gap-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="p-6 bg-[#121215] border border-[#27272A] rounded-lg space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-56 bg-[#27272A] rounded" />
                  <div className="h-3 w-36 bg-[#18181C] rounded" />
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-8 bg-[#18181C] rounded" />
                  <div className="h-8 w-8 bg-[#18181C] rounded" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 bg-[#18181C] rounded" />
                <div className="h-6 w-20 bg-[#18181C] rounded" />
                <div className="h-6 w-14 bg-[#18181C] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === "table" && (
        <div className="border border-[#27272A] rounded-lg bg-[#0A0A0C] overflow-hidden animate-pulse">
          <div className="bg-[#121215] border-b border-[#27272A] p-4 flex justify-between">
            <div className="h-3 w-20 bg-[#27272A] rounded" />
            <div className="h-3 w-28 bg-[#27272A] rounded" />
            <div className="h-3 w-40 bg-[#27272A] rounded" />
            <div className="h-3 w-20 bg-[#27272A] rounded" />
          </div>
          <div className="divide-y divide-[#27272A]">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="h-5 w-5 bg-[#18181C] rounded-full" />
                <div className="space-y-2 w-40">
                  <div className="h-4 w-28 bg-[#27272A] rounded" />
                  <div className="h-3 w-36 bg-[#18181C] rounded" />
                </div>
                <div className="h-4 w-64 bg-[#18181C] rounded" />
                <div className="h-4 w-20 bg-[#18181C] rounded" />
                <div className="h-8 w-20 bg-[#18181C] rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "form" && (
        <div className="bg-[#121215] border border-[#27272A] p-6 rounded-lg max-w-2xl space-y-4 animate-pulse">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-[#18181C] border border-[#27272A] rounded" />
            <div className="h-12 bg-[#18181C] border border-[#27272A] rounded" />
          </div>
          <div className="h-28 bg-[#18181C] border border-[#27272A] rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-[#18181C] border border-[#27272A] rounded" />
            <div className="h-12 bg-[#18181C] border border-[#27272A] rounded" />
          </div>
          <div className="h-10 w-44 bg-[#27272A] rounded ml-auto" />
        </div>
      )}
    </div>
  )
}

export function RefreshingBadge({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#DEFF9A] bg-[#18181C] border border-[#27272A] px-2.5 py-1 rounded">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      SYNCING...
    </span>
  )
}
