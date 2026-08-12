"use client"

import { useState, useEffect } from "react"
import { History, Trash2, PanelLeft } from "lucide-react"
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

// Group items into Today / Yesterday / Older
function groupByDate(items: HistoryItem[]) {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const groups: { label: string; items: HistoryItem[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Older", items: [] },
  ]
  for (const it of items) {
    const d = it.created_at ? new Date(it.created_at) : new Date()
    if (sameDay(d, today)) groups[0].items.push(it)
    else if (sameDay(d, yesterday)) groups[1].items.push(it)
    else groups[2].items.push(it)
  }
  return groups.filter((g) => g.items.length > 0)
}

export function HistorySidebar({ open, onToggle, onSelect, refreshKey }: HistorySidebarProps) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    fetch(`${API_BASE}/jobs/mine/history`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (open) load()
  }, [open, refreshKey])

  const deleteOne = async (jobId: number) => {
    await fetch(`${API_BASE}/jobs/mine/history/${jobId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    setConfirmDelete(null)
    setItems((prev) => prev.filter((i) => i.job_id !== jobId))
  }

  const clearAll = async () => {
    await fetch(`${API_BASE}/jobs/mine/history`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    setConfirmClear(false)
    setItems([])
  }

  const groups = groupByDate(items)

  return (
    <aside
      className={`flex flex-col border-r border-border bg-muted/20 transition-all duration-300 overflow-hidden ${
        open ? "w-72" : "w-0"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">History</span>
        </div>
        <div className="flex items-center gap-1">
          {items.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground p-1">
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clear-all confirmation */}
      {confirmClear && (
        <div className="mx-3 my-2 p-3 rounded-lg border border-red-200 bg-red-50 shrink-0">
          <p className="text-xs text-red-800 mb-2">Delete all build history? This can't be undone.</p>
          <div className="flex gap-2">
            <button onClick={clearAll} className="flex-1 text-xs bg-red-500 text-white rounded-md py-1.5 hover:bg-red-600">
              Delete all
            </button>
            <button onClick={() => setConfirmClear(false)} className="flex-1 text-xs border border-border rounded-md py-1.5 hover:bg-card">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="p-3 text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No builds yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Your image builds will appear here.</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-2">
              <div className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide px-2 pt-2 pb-1">
                {group.label}
              </div>
              {group.items.map((item) => (
                <div key={item.job_id} className="group relative">
                  <button
                    onClick={() => onSelect(item.job_id)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-card transition-colors text-left"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        item.status === "completed"
                          ? "bg-green-500"
                          : item.status === "failed"
                          ? "bg-red-500"
                          : "bg-amber-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-foreground truncate">{item.template_name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                        {item.os ? ` · ${item.os}` : item.status === "failed" ? " · failed" : ""}
                      </div>
                    </div>
                  </button>
                  {/* per-item delete */}
                  {confirmDelete === item.job_id ? (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-card px-1 rounded-md">
                      <button onClick={() => deleteOne(item.job_id)} className="text-[11px] text-red-500 px-1.5 py-0.5 hover:bg-red-50 rounded">
                        Delete
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="text-[11px] text-muted-foreground px-1 py-0.5 hover:bg-muted rounded">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(item.job_id)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 p-1.5 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}