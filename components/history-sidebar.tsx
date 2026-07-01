"use client"

import { useState, useEffect } from "react"
import { PanelLeft, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { getToken } from "@/lib/auth"

const API_BASE = "http://10.202.135.233:8000"

interface HistoryItem {
  job_id: number
  status: string
  template_name: string
  os: string
  created_at: string
}

interface HistorySidebarProps {
  open: boolean
  onToggle: () => void
  onSelect: (jobId: number) => void
  refreshKey: number
}

export function HistorySidebar({ open, onToggle, onSelect, refreshKey }: HistorySidebarProps) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`${API_BASE}/jobs/mine/history`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [open, refreshKey])

  const statusIcon = (s: string) => {
    if (s === "completed") return <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
    if (s === "failed") return <XCircle className="w-3.5 h-3.5 text-red-500" />
    return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
  }

  return (
    <aside
      className={`flex flex-col border-r border-border bg-muted/30 transition-all duration-300 overflow-hidden ${
        open ? "w-64" : "w-0"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-foreground">History</span>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground text-center">
            No builds yet
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.job_id}
              onClick={() => onSelect(item.job_id)}
              className="w-full text-left rounded-lg px-3 py-2.5 mb-1 hover:bg-card transition-colors group"
            >
              <div className="flex items-center gap-2 mb-0.5">
                {statusIcon(item.status)}
                <span className="text-sm font-medium text-foreground truncate">
                  {item.template_name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pl-5">
                <Clock className="w-3 h-3" />
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString([], {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })
                  : ""}
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}