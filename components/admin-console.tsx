"use client"

import { useState } from "react"
   import {
  LayoutDashboard, BarChart3, Server, Users, Settings,
  MessageSquare, Box, ChevronRight, HardDrive,
} from "lucide-react"

// Pages (built incrementally — start as placeholders, fill in next)
import { OverviewPage } from "@/components/admin/overview-page"
// import { StatisticsPage } from "@/components/admin/statistics-page"
import { BuildsPage } from "@/components/admin/builds-page"
// import { UsersPage } from "@/components/admin/users-page"
// import { SettingsPage } from "@/components/admin/settings-page"
import { StoragePage } from "@/components/admin/storage-page"
import { UsersPage } from "@/components/admin/users-page"
import { ProfilePage } from "@/components/admin/profile-page"

type AdminSection = "overview" | "statistics" | "builds" | "storage" | "users" | "settings" | "profile"
interface AdminConsoleProps {
  currentUser: any
  onBackToChat: () => void
}

const NAV: { key: AdminSection; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "statistics", label: "Statistics", icon: BarChart3 },
  { key: "builds", label: "Builds", icon: Server },
  { key: "storage", label: "Storage", icon: HardDrive },   // ← add
  { key: "users", label: "Users", icon: Users },
  { key: "settings", label: "Settings", icon: Settings },
]

export function AdminConsole({ currentUser, onBackToChat }: AdminConsoleProps) {
  const [section, setSection] = useState<AdminSection>("overview")

  const initial = (currentUser?.username || "A").charAt(0).toUpperCase()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-muted/20 flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Box className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">Image Factory</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = section === item.key
            return (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Footer: back to chat + profile */}
        <div className="px-2 py-2 border-t border-border space-y-0.5">
          <button
            onClick={onBackToChat}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Back to chat
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </button>
          <button
            onClick={() => setSection("profile")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              section === "profile" ? "bg-card" : "hover:bg-card"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-primary/80 flex items-center justify-center shrink-0">
              <span className="text-xs text-primary-foreground font-semibold">{initial}</span>
            </div>
            <div className="min-w-0 text-left">
              <div className="text-sm text-foreground truncate">{currentUser?.username || "admin"}</div>
              <div className="text-[11px] text-muted-foreground">Administrator</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {section === "overview" && <OverviewPage />}
        {section === "statistics" && <Placeholder title="Statistics" />}
        {section === "builds" && <BuildsPage />}
        {section === "users" && <UsersPage />}
        {section === "settings" && <Placeholder title="Settings" />}
        {section === "storage" && <StoragePage />}
        {section === "profile" && <ProfilePage />}
      </main>
    </div>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold text-foreground mb-1">{title}</h1>
      <p className="text-sm text-muted-foreground">This section is coming next.</p>
    </div>
  )
}
