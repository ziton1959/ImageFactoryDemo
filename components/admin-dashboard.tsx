"use client"

import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"
import {
  Users, HardDrive, Package, Activity, Trash2, Server, ChevronLeft,
} from "lucide-react"

const API_BASE = "http://10.202.135.233:8000"

interface AdminDashboardProps {
  onBack: () => void
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [builds, setBuilds] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [storage, setStorage] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)
  const [tab, setTab] = useState<"builds" | "users" | "storage">("builds")
  const [loading, setLoading] = useState(true)
  const [confirmUser, setConfirmUser] = useState<number | null>(null)
  const [confirmImage, setConfirmImage] = useState<string | null>(null)

  const authHeader = { Authorization: `Bearer ${getToken()}` }

  const loadAll = async () => {
    setLoading(true)
    try {
      const [b, u, s, h] = await Promise.all([
        fetch(`${API_BASE}/admin/builds`, { headers: authHeader }).then((r) => r.json()),
        fetch(`${API_BASE}/admin/users`, { headers: authHeader }).then((r) => r.json()),
        fetch(`${API_BASE}/admin/storage`, { headers: authHeader }).then((r) => r.json()),
        fetch(`${API_BASE}/admin/health`, { headers: authHeader }).then((r) => r.json()),
      ])
      setBuilds(Array.isArray(b) ? b : [])
      setUsers(Array.isArray(u) ? u : [])
      setStorage(s)
      setHealth(h)
    } catch {
      // leave defaults
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const changeRole = async (id: number, role: string) => {
    await fetch(`${API_BASE}/admin/users/${id}/role`, {
      method: "PATCH",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
  }

  const deleteUser = async (id: number) => {
    await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE", headers: authHeader })
    setConfirmUser(null)
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const deleteImage = async (name: string) => {
    await fetch(`${API_BASE}/admin/images/${encodeURIComponent(name.replace(".qcow2", ""))}`, {
      method: "DELETE", headers: authHeader,
    })
    setConfirmImage(null)
    setStorage((prev: any) => ({
      ...prev,
      images: prev.images.filter((i: any) => i.name !== name),
      image_count: prev.image_count - 1,
    }))
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "text-green-700 bg-green-100",
      failed: "text-red-700 bg-red-100",
      running: "text-amber-700 bg-amber-100",
      queued: "text-amber-700 bg-amber-100",
      pending: "text-muted-foreground bg-muted",
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || "text-muted-foreground bg-muted"}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground p-1">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Admin dashboard</h1>
              <p className="text-sm text-muted-foreground">Platform overview and management</p>
            </div>
          </div>
          {health && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${health.all_healthy ? "bg-green-100" : "bg-red-100"}`}>
              <span className={`w-2 h-2 rounded-full ${health.all_healthy ? "bg-green-500" : "bg-red-500"}`} />
              <span className={`text-xs ${health.all_healthy ? "text-green-700" : "text-red-700"}`}>
                {health.all_healthy ? "All systems operational" : "Service issue detected"}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading dashboard…</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatCard icon={<Activity className="w-4 h-4" />} label="Total builds" value={builds.length} />
              <StatCard icon={<Users className="w-4 h-4" />} label="Users" value={users.length} />
              <StatCard icon={<Package className="w-4 h-4" />} label="Images stored" value={storage?.image_count ?? "—"} />
              <StatCard icon={<HardDrive className="w-4 h-4" />} label="Storage used" value={`${storage?.total_gb ?? "—"} GB`} />
            </div>

            {/* Services + largest images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Services</span>
                </div>
                <div className="space-y-2">
                  {health && Object.entries(health.services).map(([name, up]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground capitalize">{name}</span>
                      <span className={`w-2 h-2 rounded-full ${up ? "bg-green-500" : "bg-red-500"}`} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Largest images</span>
                </div>
                <div className="space-y-1.5">
                  {storage?.images?.slice(0, 4).map((img: any) => (
                    <div key={img.name} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[180px]">{img.name}</span>
                      <span className="text-muted-foreground/70">{img.size_mb} MB</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex border-b border-border">
                {(["builds", "users", "storage"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`text-sm px-4 py-3 capitalize ${
                      tab === t ? "font-medium text-foreground border-b-2 border-primary" : "text-muted-foreground"
                    }`}
                  >
                    {t === "builds" ? "All builds" : t}
                  </button>
                ))}
              </div>

              {/* Builds tab */}
              {tab === "builds" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        <th className="text-left font-medium px-4 py-2">#</th>
                        <th className="text-left font-medium px-4 py-2">Template</th>
                        <th className="text-left font-medium px-4 py-2">User</th>
                        <th className="text-left font-medium px-4 py-2">OS</th>
                        <th className="text-left font-medium px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {builds.map((b) => (
                        <tr key={b.job_id} className="border-t border-border">
                          <td className="px-4 py-2.5 text-muted-foreground">{b.job_id}</td>
                          <td className="px-4 py-2.5 text-foreground">{b.template_name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{b.owner}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{b.os || "—"}</td>
                          <td className="px-4 py-2.5">{statusBadge(b.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Users tab */}
              {tab === "users" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        <th className="text-left font-medium px-4 py-2">User</th>
                        <th className="text-left font-medium px-4 py-2">Email</th>
                        <th className="text-left font-medium px-4 py-2">Builds</th>
                        <th className="text-left font-medium px-4 py-2">Role</th>
                        <th className="text-right font-medium px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-t border-border">
                          <td className="px-4 py-2.5 text-foreground">{u.username}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{u.build_count}</td>
                          <td className="px-4 py-2.5">
                            <select
                              value={u.role === "admin" ? "admin" : "user"}
                              onChange={(e) => changeRole(u.id, e.target.value)}
                              className="text-xs border border-border rounded-md px-2 py-1 bg-background"
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {confirmUser === u.id ? (
                              <span className="inline-flex items-center gap-1">
                                <button onClick={() => deleteUser(u.id)} className="text-xs text-red-600 px-2 py-1 hover:bg-red-50 rounded">Delete</button>
                                <button onClick={() => setConfirmUser(null)} className="text-xs text-muted-foreground px-1">✕</button>
                              </span>
                            ) : (
                              <button onClick={() => setConfirmUser(u.id)} className="text-muted-foreground hover:text-red-500 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Storage tab */}
              {tab === "storage" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        <th className="text-left font-medium px-4 py-2">Image</th>
                        <th className="text-left font-medium px-4 py-2">Size</th>
                        <th className="text-left font-medium px-4 py-2">Modified</th>
                        <th className="text-right font-medium px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storage?.images?.map((img: any) => (
                        <tr key={img.name} className="border-t border-border">
                          <td className="px-4 py-2.5 text-foreground">{img.name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{img.size_mb} MB</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {img.last_modified ? new Date(img.last_modified).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {confirmImage === img.name ? (
                              <span className="inline-flex items-center gap-1">
                                <button onClick={() => deleteImage(img.name)} className="text-xs text-red-600 px-2 py-1 hover:bg-red-50 rounded">Delete</button>
                                <button onClick={() => setConfirmImage(null)} className="text-xs text-muted-foreground px-1">✕</button>
                              </span>
                            ) : (
                              <button onClick={() => setConfirmImage(img.name)} className="text-muted-foreground hover:text-red-500 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <div className="rounded-lg bg-muted/40 p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
    </div>
  )
}
