"use client"

import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts"

const API_BASE = "http://10.202.135.233:8000"

export function OverviewPage() {
  const [data, setData] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = { Authorization: `Bearer ${getToken()}` }
    Promise.all([
      fetch(`${API_BASE}/admin/stats/overview`, { headers: auth }).then((r) => r.json()),
      fetch(`${API_BASE}/admin/health`, { headers: auth }).then((r) => r.json()),
    ])
      .then(([o, h]) => { setData(o); setHealth(h) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-muted-foreground">Loading overview…</div>
  if (!data) return <div className="p-8 text-muted-foreground">Could not load stats.</div>

  const statusColors: Record<string, string> = {
    completed: "#22c55e",
    failed: "#ef4444",
    running: "#f59e0b",
    queued: "#f59e0b",
    pending: "#94a3b8",
  }
  const statusData = (data.status_breakdown || []).map((s: any) => ({
    name: s.status,
    value: s.count,
    color: statusColors[s.status] || "#94a3b8",
  }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">Platform activity and health</p>
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total builds" value={data.total_builds} />
        <StatCard label="Success rate" value={`${data.success_rate}%`} accent="green" />
        <StatCard label="Users" value={data.total_users} />
        <StatCard label="Storage" value={`${data.storage_gb} GB`} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Builds over time */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Builds over time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.builds_per_day || []}>
              <defs>
                <linearGradient id="buildGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#buildGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status donut */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Build status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                {statusData.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {statusData.map((s: any) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                <span className="text-xs text-muted-foreground capitalize">{s.name} {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 — builds by OS */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Builds by OS</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.builds_by_os || []}>
            <XAxis dataKey="os" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: any; accent?: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${accent === "green" ? "text-green-600" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  )
}
