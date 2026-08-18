"use client"

import { useState, useEffect, useCallback } from "react"
import { getToken } from "@/lib/auth"
import { Search, X } from "lucide-react"

const API_BASE = "http://10.202.135.233:8000"

export function BuildsPage() {
  const [builds, setBuilds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [os, setOs] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (status) params.set("status", status)
    if (os) params.set("os", os)
    try {
      const res = await fetch(`${API_BASE}/admin/builds/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      setBuilds(Array.isArray(data) ? data : [])
    } catch {
      setBuilds([])
    } finally {
      setLoading(false)
    }
  }, [q, status, os])

  // debounce search
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const clearFilters = () => { setQ(""); setStatus(""); setOs("") }
  const hasFilters = q || status || os

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      completed: "text-green-700 bg-green-100",
      failed: "text-red-700 bg-red-100",
      running: "text-amber-700 bg-amber-100",
      queued: "text-amber-700 bg-amber-100",
      pending: "text-muted-foreground bg-muted",
    }
    return <span className={`text-xs px-2 py-0.5 rounded-full ${styles[s] || "text-muted-foreground bg-muted"}`}>{s}</span>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Builds</h1>
        <p className="text-sm text-muted-foreground">Search and filter all builds across users</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search template, user, OS, package…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2"
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
          <option value="queued">Queued</option>
        </select>

        <select
          value={os}
          onChange={(e) => setOs(e.target.value)}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2"
        >
          <option value="">All OS</option>
          <option value="ubuntu">Ubuntu</option>
          <option value="debian">Debian</option>
          <option value="rocky">Rocky</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-2 py-2"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-muted-foreground mb-2">
        {loading ? "Searching…" : `${builds.length} build${builds.length === 1 ? "" : "s"}`}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="text-left font-medium px-4 py-2.5">#</th>
                <th className="text-left font-medium px-4 py-2.5">Template</th>
                <th className="text-left font-medium px-4 py-2.5">User</th>
                <th className="text-left font-medium px-4 py-2.5">OS</th>
                <th className="text-left font-medium px-4 py-2.5">Packages</th>
                <th className="text-left font-medium px-4 py-2.5">Date</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {builds.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No builds match your filters.
                  </td>
                </tr>
              ) : (
                builds.map((b) => (
                  <tr key={b.job_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-muted-foreground">{b.job_id}</td>
                    <td className="px-4 py-2.5 text-foreground">{b.template_name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{b.owner}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{b.os || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <span className="truncate block max-w-[160px]">
                        {(b.packages || []).join(", ") || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2.5">{statusBadge(b.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
