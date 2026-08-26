"use client"

import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts"
import { Clock, Package, Users, AlertTriangle } from "lucide-react"

const API_BASE = "http://10.202.135.233:8000"

export function StatisticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/admin/stats/detailed`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-muted-foreground">Loading statistics…</div>
  if (!data) return <div className="p-8 text-muted-foreground">Could not load statistics.</div>

  const fmtDuration = (secs: number) => {
    if (!secs) return "—"
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Statistics</h1>
        <p className="text-sm text-muted-foreground">Deeper analytics on builds, packages, and reliability</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg bg-muted/40 p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Avg build time</span>
          </div>
          <div className="text-2xl font-semibold text-foreground">{fmtDuration(data.avg_duration_seconds)}</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Package className="w-4 h-4" />
            <span className="text-xs">Completed builds</span>
          </div>
          <div className="text-2xl font-semibold text-foreground">{data.total_completed}</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">Failure points</span>
          </div>
          <div className="text-2xl font-semibold text-foreground">
            {(data.failures_by_phase || []).reduce((a: number, f: any) => a + f.count, 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top packages */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Most requested packages</h3>
          </div>
          {(data.top_packages || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No package data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, (data.top_packages?.length || 0) * 32)}>
              <BarChart data={data.top_packages} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="package" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Builds per user */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Builds per user</h3>
          </div>
          {(data.builds_per_user || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, (data.builds_per_user?.length || 0) * 32)}>
              <BarChart data={data.builds_per_user} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="user" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Build duration by OS */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Avg duration by OS</h3>
          </div>
          {(data.duration_by_os || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed builds yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.duration_by_os}>
                <XAxis dataKey="os" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40}
                  tickFormatter={(v) => `${Math.floor(v / 60)}m`} />
                <Tooltip formatter={(v: any) => fmtDuration(v)} />
                <Bar dataKey="avg_seconds" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Failures by phase */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Failures by phase</h3>
          </div>
          {(data.failures_by_phase || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No failures recorded. 🎉</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.failures_by_phase}>
                <XAxis dataKey="phase" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]}>
                  {data.failures_by_phase.map((_: any, i: number) => (
                    <Cell key={i} fill="#ef4444" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
