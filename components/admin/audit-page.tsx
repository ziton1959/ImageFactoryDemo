"use client"

import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"
import {
  Trash2, Archive, ArchiveRestore, Shield, UserPlus, Settings as SettingsIcon,
  ScrollText, Activity,
} from "lucide-react"

const API_BASE = "http://10.202.135.233:8000"

const ACTION_META: Record<string, { label: string; icon: any; color: string }> = {
  delete_build: { label: "Deleted build", icon: Trash2, color: "text-red-600 bg-red-100" },
  delete_image: { label: "Deleted image", icon: Trash2, color: "text-red-600 bg-red-100" },
  archive_user: { label: "Archived user", icon: Archive, color: "text-amber-600 bg-amber-100" },
  unarchive_user: { label: "Restored user", icon: ArchiveRestore, color: "text-green-600 bg-green-100" },
  create_user: { label: "Created user", icon: UserPlus, color: "text-blue-600 bg-blue-100" },
  change_role: { label: "Changed role", icon: Shield, color: "text-purple-600 bg-purple-100" },
  update_settings: { label: "Updated settings", icon: SettingsIcon, color: "text-slate-600 bg-slate-100" },
}

export function AuditPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/admin/audit`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  const timeAgo = (iso: string) => {
    if (!iso) return ""
    const then = new Date(iso).getTime()
    const diff = Math.floor((Date.now() - then) / 1000)
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(iso).toLocaleDateString()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Audit log</h1>
        <p className="text-sm text-muted-foreground">A record of administrative actions</p>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading audit log…</div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <ScrollText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No admin actions recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {entries.map((e, i) => {
            const meta = ACTION_META[e.action] || { label: e.action, icon: Activity, color: "text-muted-foreground bg-muted" }
            const Icon = meta.icon
            return (
              <div
                key={e.id}
                className={`flex items-center gap-3 px-4 py-3 ${i !== entries.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">
                    <span className="font-medium">{e.actor}</span>{" "}
                    <span className="text-muted-foreground">{meta.label.toLowerCase()}</span>
                    {e.target ? <span className="text-foreground"> {e.target}</span> : null}
                  </div>
                  {e.details ? (
                    <div className="text-xs text-muted-foreground truncate">{e.details}</div>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {timeAgo(e.created_at)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
