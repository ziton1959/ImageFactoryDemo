"use client"

import { useState, useEffect, useCallback } from "react"
import { getToken } from "@/lib/auth"
import { Search, X, ArrowUpDown, Trash2, SlidersHorizontal } from "lucide-react"

const API_BASE = "http://10.202.135.233:8000"

export function BuildsPage() {
  const [builds, setBuilds] = useState<any[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [os, setOs] = useState("")
  const [user, setUser] = useState("")
  const [sort, setSort] = useState<"newest" | "oldest">("newest")
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const auth = { Authorization: `Bearer ${getToken()}` }

  // load usernames for the filter dropdown
  useEffect(() => {
    fetch(`${API_BASE}/admin/users`, { headers: auth })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setUsers(Array.isArray(data) ? data.map((u: any) => u.username) : []))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (status) params.set("status", status)
    if (os) params.set("os", os)
    if (user) params.set("user", user)
    params.set("sort", sort)
    try {
      const res = await fetch(`${API_BASE}/admin/builds/search?${params.toString()}`, { headers: auth })
      const data = await res.json()
      setBuilds(Array.isArray(data) ? data : [])
    } catch {
      setBuilds([])
    } finally {
      setLoading(false)
    }
  }, [q, status, os, user, sort])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const deleteBuild = async (jobId: number) => {
    await fetch(`${API_BASE}/admin/builds/${jobId}`, { method: "DELETE", headers: auth })
    setConfirmDelete(null)
    setBuilds((prev) => prev.filter((b) => b.job_id !== jobId))
  }

  const clearFilters = () => { setQ(""); setStatus(""); setOs(""); setUser("") }
  const hasFilters = q || status || os || user

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      completed: "text-green-700 bg-green-100",
      failed: "text-red-700 bg-red-100",
      running: "text-amber-700 bg-amber-100",
      queued: "text-amber-700 bg-amber-100",
      pending: "text-muted-foreground bg-muted",
    }
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[s] || "text-muted-foreground bg-muted"}`}>{s}</span>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Builds</h1>
        <p className="text-sm text-muted-foreground">Search, filter, and manage all builds across users</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search template, user, OS, or package…"
          className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </div>

        <FilterSelect value={user} onChange={setUser} placeholder="All users"
          options={users.map((u) => ({ value: u, label: u }))} />

        <FilterSelect value={status} onChange={setStatus} placeholder="All statuses"
          options={[
            { value: "completed", label: "Completed" },
            { value: "failed", label: "Failed" },
            { value: "running", label: "Running" },
            { value: "queued", label: "Queued" },
          ]} />

        <FilterSelect value={os} onChange={setOs} placeholder="All OS"
          options={[
            { value: "ubuntu", label: "Ubuntu" },
            { value: "debian", label: "Debian" },
            { value: "rocky", label: "Rocky" },
          ]} />

        {/* Sort toggle */}
        <button
          onClick={() => setSort((s) => (s === "newest" ? "oldest" : "newest"))}
          className="flex items-center gap-1.5 text-sm rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted/50 transition"
          title="Toggle sort order"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          {sort === "newest" ? "Newest first" : "Oldest first"}
        </button>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-2 py-2">
            <X className="w-4 h-4" />
            Clear
          </button>
        )}

        <div className="ml-auto text-xs text-muted-foreground">
          {loading ? "Searching…" : `${builds.length} result${builds.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/30">
                <th className="text-left font-medium px-4 py-3">#</th>
                <th className="text-left font-medium px-4 py-3">Template</th>
                <th className="text-left font-medium px-4 py-3">User</th>
                <th className="text-left font-medium px-4 py-3">OS</th>
                <th className="text-left font-medium px-4 py-3">Packages</th>
                <th className="text-left font-medium px-4 py-3">Date</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-right font-medium px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {builds.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No builds match your filters.
                  </td>
                </tr>
              ) : (
                builds.map((b) => (
                  <tr key={b.job_id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3 text-muted-foreground">{b.job_id}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{b.template_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.owner}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.os || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="truncate block max-w-[160px]">{(b.packages || []).join(", ") || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">{statusBadge(b.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {confirmDelete === b.job_id ? (
                        <span className="inline-flex items-center gap-1">
                          <button onClick={() => deleteBuild(b.job_id)} className="text-xs text-red-600 px-2 py-1 rounded hover:bg-red-50">Delete</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs text-muted-foreground px-1">✕</button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(b.job_id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 p-1 transition-opacity"
                          title="Delete build"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
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

function FilterSelect({
  value, onChange, placeholder, options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-sm rounded-lg border px-3 py-2 bg-background transition ${
        value ? "border-primary text-foreground" : "border-border text-muted-foreground"
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
