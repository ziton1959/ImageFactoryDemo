"use client"

import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"
import { Cpu, Server, Wrench, Check, Bot } from "lucide-react"

const API_BASE = "http://10.202.135.233:8000"

const OS_OPTIONS = ["Ubuntu 22.04", "Ubuntu 24.04", "Debian 12", "Rocky 9"]
const CPU_OPTIONS = [1, 2, 4, 8]
const RAM_OPTIONS = [2, 4, 8, 16]
const MODEL_OPTIONS = [
  { value: "llama3.1:8b", label: "LLaMA 3.1 8B — fast (~0.4s), recommended" },
  { value: "llama3.1:70b", label: "LLaMA 3.1 70B — slower, higher quality" },
]

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const auth = { Authorization: `Bearer ${getToken()}` }

  useEffect(() => {
    fetch(`${API_BASE}/admin/settings`, { headers: auth })
      .then((r) => (r.ok ? r.json() : {}))
      .then((s) => setSettings(s || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: "PATCH",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        const updated = await res.json()
        setSettings(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading settings…</div>

  const maintenanceOn = (settings.maintenance_mode || "false").toLowerCase() === "true"

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Platform-wide configuration</p>
      </div>

      {/* AI model */}
      <section className="rounded-xl border border-border bg-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">AI model</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Which LLaMA model parses user requests. Smaller is faster; larger is more capable.
        </p>
        <select
          value={settings.active_model || "llama3.1:8b"}
          onChange={(e) => update("active_model", e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </section>

      {/* Build defaults */}
      <section className="rounded-xl border border-border bg-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Build defaults</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Fallback values used when a user doesn&apos;t specify them.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default OS</label>
            <select
              value={settings.default_os || "Ubuntu 22.04"}
              onChange={(e) => update("default_os", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
            >
              {OS_OPTIONS.map((os) => <option key={os} value={os}>{os}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default CPU</label>
            <select
              value={settings.default_cpu || "2"}
              onChange={(e) => update("default_cpu", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
            >
              {CPU_OPTIONS.map((c) => <option key={c} value={String(c)}>{c} core{c > 1 ? "s" : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default RAM</label>
            <select
              value={settings.default_ram_gb || "4"}
              onChange={(e) => update("default_ram_gb", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background"
            >
              {RAM_OPTIONS.map((r) => <option key={r} value={String(r)}>{r} GB</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Maintenance mode */}
      <section className={`rounded-xl border p-6 mb-6 transition-colors ${maintenanceOn ? "border-amber-300 bg-amber-50" : "border-border bg-card"}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className={`w-4 h-4 ${maintenanceOn ? "text-amber-600" : "text-muted-foreground"}`} />
              <h2 className="text-sm font-medium text-foreground">Maintenance mode</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              When on, new builds are blocked platform-wide with a maintenance message. Useful while updating the system.
            </p>
          </div>
          {/* Toggle */}
          <button
            onClick={() => update("maintenance_mode", maintenanceOn ? "false" : "true")}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${maintenanceOn ? "bg-amber-500" : "bg-muted-foreground/30"}`}
            role="switch"
            aria-checked={maintenanceOn}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${maintenanceOn ? "translate-x-5" : ""}`} />
          </button>
        </div>
        {maintenanceOn && (
          <div className="mt-3 text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
            Maintenance mode is active — users cannot start new builds right now.
          </div>
        )}
      </section>

      {/* Save bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="text-sm bg-primary text-primary-foreground rounded-lg px-5 py-2.5 hover:bg-primary/90 transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="w-4 h-4" />
            Settings saved
          </span>
        )}
      </div>
    </div>
  )
}
