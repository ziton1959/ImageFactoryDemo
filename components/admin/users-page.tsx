"use client"

import { useState, useEffect, useCallback } from "react"
import { getToken } from "@/lib/auth"
import { Search, UserPlus, Trash2, Shield, User as UserIcon } from "lucide-react"

const API_BASE = "http://10.202.135.233:8000"

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const auth = { Authorization: `Bearer ${getToken()}` }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { headers: auth })
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const changeRole = async (id: number, role: string) => {
    await fetch(`${API_BASE}/admin/users/${id}/role`, {
      method: "PATCH",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
  }

  const deleteUser = async (id: number) => {
    await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE", headers: auth })
    setDeleteTarget(null)
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const filtered = users.filter((u) =>
    !q ||
    u.username.toLowerCase().includes(q.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">Manage accounts, roles, and access</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 text-sm bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90 transition"
        >
          <UserPlus className="w-4 h-4" />
          Add user
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by username or email…"
          className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/30">
              <th className="text-left font-medium px-4 py-3">User</th>
              <th className="text-left font-medium px-4 py-3">Email</th>
              <th className="text-left font-medium px-4 py-3">Builds</th>
              <th className="text-left font-medium px-4 py-3">Role</th>
              <th className="text-right font-medium px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center shrink-0">
                        <span className="text-xs text-primary-foreground font-semibold">
                          {u.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-foreground font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.build_count}</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1.5">
                      {u.role === "admin" ? (
                        <Shield className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <select
                        value={u.role === "admin" ? "admin" : "user"}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="text-xs border border-border rounded-md px-2 py-1 bg-background"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 p-1 transition-opacity"
                      title="Delete user"
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

      {/* Create user modal */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={(newUser) => {
            setUsers((prev) => [...prev, { ...newUser, build_count: 0 }])
            setShowCreate(false)
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Delete this user?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              You&apos;re about to delete <span className="font-medium text-foreground">{deleteTarget.username}</span>
              {deleteTarget.build_count > 0 ? ` and lose the link to their ${deleteTarget.build_count} build(s)` : ""}.
              This can&apos;t be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 text-sm border border-border rounded-lg py-2 hover:bg-muted/50 transition">
                Cancel
              </button>
              <button onClick={() => deleteUser(deleteTarget.id)} className="flex-1 text-sm bg-red-500 text-white rounded-lg py-2 hover:bg-red-600 transition">
                Delete user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: any) => void }) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("user")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setError("")
    if (!username.trim() || !email.trim() || !password) {
      setError("All fields are required.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || "Could not create user.")
        setSaving(false)
        return
      }
      onCreated(data)
    } catch {
      setError("Network error. Try again.")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-foreground mb-4">Add a new user</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background">
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 text-sm border border-border rounded-lg py-2 hover:bg-muted/50 transition">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 text-sm bg-primary text-primary-foreground rounded-lg py-2 hover:bg-primary/90 transition disabled:opacity-50">
            {saving ? "Creating…" : "Create user"}
          </button>
        </div>
      </div>
    </div>
  )
}
