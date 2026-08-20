"use client"

import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"
import { Shield, User as UserIcon, Mail, Lock, Check } from "lucide-react"

const API_BASE = "http://10.202.135.233:8000"

export function ProfilePage() {
  const [me, setMe] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setMe(u))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-muted-foreground">Loading profile…</div>
  if (!me) return <div className="p-8 text-muted-foreground">Could not load profile.</div>

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account information and security</p>
      </div>

      {/* Identity card */}
      <div className="rounded-xl border border-border bg-card p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-2xl text-primary-foreground font-semibold">
              {me.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">{me.username}</div>
            <div className="text-sm text-muted-foreground">{me.email}</div>
            <div className="inline-flex items-center gap-1.5 mt-1.5">
              {me.role === "admin" ? (
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" /> Administrator
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  <UserIcon className="w-3 h-3" /> User
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change email */}
      <EmailCard currentEmail={me.email} onUpdated={(email) => setMe({ ...me, email })} />

      {/* Change password */}
      <PasswordCard />
    </div>
  )
}

function EmailCard({ currentEmail, onUpdated }: { currentEmail: string; onUpdated: (e: string) => void }) {
  const [email, setEmail] = useState(currentEmail)
  const [password, setPassword] = useState("")
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setMsg(null)
    if (!email.trim() || !password) {
      setMsg({ type: "err", text: "Enter the new email and your current password." })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/auth/me/email`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ new_email: email.trim(), current_password: password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: data.detail || "Could not update email." })
      } else {
        setMsg({ type: "ok", text: "Email updated." })
        setPassword("")
        onUpdated(data.email)
      }
    } catch {
      setMsg({ type: "err", text: "Network error." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-foreground">Email address</h2>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">New email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Current password (to confirm)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>
      {msg && (
        <p className={`text-xs mt-3 flex items-center gap-1 ${msg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
          {msg.type === "ok" && <Check className="w-3.5 h-3.5" />}
          {msg.text}
        </p>
      )}
      <button onClick={save} disabled={saving}
        className="mt-4 text-sm bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90 transition disabled:opacity-50">
        {saving ? "Saving…" : "Update email"}
      </button>
    </div>
  )
}

function PasswordCard() {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setMsg(null)
    if (!current || !next) {
      setMsg({ type: "err", text: "Fill in all password fields." })
      return
    }
    if (next !== confirm) {
      setMsg({ type: "err", text: "New passwords don't match." })
      return
    }
    if (next.length < 6) {
      setMsg({ type: "err", text: "New password must be at least 6 characters." })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/auth/me/password`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: current, new_password: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: data.detail || "Could not update password." })
      } else {
        setMsg({ type: "ok", text: "Password updated." })
        setCurrent(""); setNext(""); setConfirm("")
      }
    } catch {
      setMsg({ type: "err", text: "Network error." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-foreground">Password</h2>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Current password</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">New password</label>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>
      {msg && (
        <p className={`text-xs mt-3 flex items-center gap-1 ${msg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
          {msg.type === "ok" && <Check className="w-3.5 h-3.5" />}
          {msg.text}
        </p>
      )}
      <button onClick={save} disabled={saving}
        className="mt-4 text-sm bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90 transition disabled:opacity-50">
        {saving ? "Saving…" : "Update password"}
      </button>
    </div>
  )
}
