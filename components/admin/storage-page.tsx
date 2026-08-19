"use client"

import { useState, useEffect, useCallback } from "react"
import { getToken } from "@/lib/auth"
import { HardDrive, Trash2, Search, Package } from "lucide-react"

const API_BASE = "http://10.202.135.233:8000"

export function StoragePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  const auth = { Authorization: `Bearer ${getToken()}` }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/storage`, { headers: auth })
      setData(await res.json())
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const deleteImage = async (name: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/admin/images/${encodeURIComponent(name.replace(".qcow2", ""))}`, {
        method: "DELETE", headers: auth,
      })
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          images: prev.images.filter((i: any) => i.name !== name),
          image_count: prev.image_count - 1,
        }))
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const images = (data?.images || []).filter((img: any) =>
    !q || img.name.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Storage</h1>
        <p className="text-sm text-muted-foreground">Manage built VM images in object storage</p>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading storage…</div>
      ) : !data ? (
        <div className="text-muted-foreground">Could not load storage.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg bg-muted/40 p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Package className="w-4 h-4" />
                <span className="text-xs">Images stored</span>
              </div>
              <div className="text-2xl font-semibold text-foreground">{data.image_count}</div>
            </div>
            <div className="rounded-lg bg-muted/40 p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <HardDrive className="w-4 h-4" />
                <span className="text-xs">Total size</span>
              </div>
              <div className="text-2xl font-semibold text-foreground">{data.total_gb} GB</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search images…"
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Image table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/30">
                  <th className="text-left font-medium px-4 py-3">Image</th>
                  <th className="text-left font-medium px-4 py-3">Size</th>
                  <th className="text-left font-medium px-4 py-3">Last modified</th>
                  <th className="text-right font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {images.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                      {q ? "No images match your search." : "No images in storage."}
                    </td>
                  </tr>
                ) : (
                  images.map((img: any) => (
                    <tr key={img.name} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3 text-foreground font-medium">{img.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{img.size_mb} MB</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {img.last_modified ? new Date(img.last_modified).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteTarget(img)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 p-1 transition-opacity"
                          title="Delete image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Delete this image?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              You&apos;re about to permanently delete{" "}
              <span className="font-medium text-foreground">{deleteTarget.name}</span>{" "}
              ({deleteTarget.size_mb} MB) from storage.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              This frees the disk space and can&apos;t be undone. Users will no longer be able to download this image.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 text-sm border border-border rounded-lg py-2 hover:bg-muted/50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteImage(deleteTarget.name)}
                disabled={deleting}
                className="flex-1 text-sm bg-red-500 text-white rounded-lg py-2 hover:bg-red-600 transition disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete image"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
