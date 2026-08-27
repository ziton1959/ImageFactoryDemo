"use client"

import { useState, useEffect, useCallback } from "react"
import { getToken } from "@/lib/auth"
import { Search, X, ArrowUpDown, Trash2, SlidersHorizontal, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { ExplainFailureModal } from "@/components/admin/explain-failure-modal"

const API_BASE = "http://10.202.135.233:8000"
const PAGE_SIZE = 10

export function BuildsPage() {
  const [builds, setBuilds] = useState<any[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [os, setOs] = useState("")
  const [user, setUser] = useState("")
  const [sort, setSort] = useState<"newest" | "oldest">("newest")
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [page, setPage] = useState(1)
  const [explainJob, setExplainJob] = useState<number | null>(null)
  const auth = { Authorization: `Bearer ${getToken()}` }

  useEffect(() => {
    fetch(`${API_BASE}/admin/users`, { headers: auth })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setUsers(Array.isArray(data) ? data.map((u: any) => u.username) : []))
      .catch(() => { })
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

  useEffect(() => { setPage(1) }, [q, status, os, user, sort])

  const deleteBuild = async (jobId: number) => {
    try {
      await fetch(`${API_BASE}/admin/builds/${jobId}`, { method: "DELETE", headers: auth })
      setBuilds((prev) => prev.filter((b) => b.job_id !== jobId))
    } catch {
      // ignore
    } finally {
      setDeleteTarget(null)
    }
  }

  const clearFilters = () => { setQ(""); setStatus(""); setOs(""); setUser("") }
  const hasFilters = q || status || os || user

  const totalPages = Math.max(1, Math.ceil(builds.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const pageItems = builds.slice(startIdx, startIdx + PAGE_SIZE)

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
              {pageItems.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No builds match your filters.
                  </td>
                </tr>
              ) : (
                pageItems.map((b) => (
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
                      <div className="inline-flex items-center gap-1">
                        {b.status === "failed" && (
                          <button
                            onClick={() => setExplainJob(b.job_id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary p-1 transition-opacity"
                            title="Why did this fail?"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(b)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 p-1 transition-opacity"
                          title="Delete build"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {builds.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Showing {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, builds.length)} of {builds.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <div className="flex items-center gap-1 px-1">
                {getPageNumbers(currentPage, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} className="px-1.5 text-muted-foreground text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`min-w-[32px] h-8 rounded-lg text-sm transition ${currentPage === p
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/50"
                        }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Delete this build?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              You&apos;re about to delete build{" "}
              <span className="font-medium text-foreground">#{deleteTarget.job_id}</span>
              {deleteTarget.template_name && deleteTarget.template_name !== "—" ? (
                <>
                  {" "}— <span className="font-medium text-foreground">{deleteTarget.template_name}</span>
                </>
              ) : null}
              .
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              This removes the build <span className="font-medium">record</span> from history only.
              The built image stays in storage — manage images separately under Storage.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 text-sm border border-border rounded-lg py-2 hover:bg-muted/50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteBuild(deleteTarget.job_id)}
                className="flex-1 text-sm bg-red-500 text-white rounded-lg py-2 hover:bg-red-600 transition"
              >
                Delete build
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Explain failure modal */}
      {explainJob !== null && (
        <ExplainFailureModal jobId={explainJob} onClose={() => setExplainJob(null)} />
      )}
    </div>
  )
}

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "…")[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push("…")
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push("…")
  pages.push(total)
  return pages
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
      className={`text-sm rounded-lg border px-3 py-2 bg-background transition ${value ? "border-primary text-foreground" : "border-border text-muted-foreground"
        }`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
