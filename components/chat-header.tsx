"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Menu, Settings, LogOut } from "lucide-react"
import Image from "next/image"

interface ChatHeaderProps {
  onNewChat?: () => void
  onLogout?: () => void
}

export function ChatHeader({ onNewChat, onLogout }: ChatHeaderProps) {
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <div className="flex items-center gap-3">
          <Image
            src="/hpe-logo-clean.png"
            alt="HPE logo"
            width={396}
            height={75}
            className="h-5 md:h-6 w-auto object-contain"
            priority
          />

          <div className="hidden sm:block h-6 w-px bg-border" />

          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-foreground">Image Builder</h1>
            <p className="text-xs text-muted-foreground">AI-Powered VM Configuration</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={onNewChat}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Chat</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
          <span className="sr-only">Settings</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setConfirmingLogout(true)}
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>

      {/* Logout confirmation dialog */}
      {confirmingLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <LogOut className="w-5 h-5 text-foreground" />
              </div>
              <h2 className="text-lg font-medium text-foreground">Sign out?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              You&apos;ll need to sign in again to continue building images. Any
              unsaved chat will be cleared.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmingLogout(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => {
                  setConfirmingLogout(false)
                  onLogout?.()
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}