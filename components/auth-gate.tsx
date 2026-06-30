"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus, AlertCircle } from "lucide-react"

const API_BASE = "http://10.202.135.233:8000"

interface AuthGateProps {
  onAuthenticated: (token: string, user: any) => void
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    setError("")
    if (!username || !password || (mode === "signup" && !email)) {
      setError("Please fill in all fields.")
      return
    }
    setLoading(true)
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup"
      const body =
        mode === "login"
          ? { username, password }
          : { username, email, password }
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || "Something went wrong.")
        setLoading(false)
        return
      }
      onAuthenticated(data.access_token, data.user)
    } catch {
      setError("Could not reach the server. Please try again.")
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-3 bg-primary" />
          <span className="text-xl font-semibold text-foreground tracking-tight">
            HPE Image Builder
          </span>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            {mode === "login" ? (
              <LogIn className="h-5 w-5 text-primary" />
            ) : (
              <UserPlus className="h-5 w-5 text-primary" />
            )}
            <h2 className="text-lg font-medium text-foreground">
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>
          </div>

          <p className="text-muted-foreground text-sm mb-6">
            {mode === "login"
              ? "Sign in to access the Image Builder platform."
              : "Create an account to start building VM images."}
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-foreground mb-1.5 block">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="your-username"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="you@company.com"
                />
              </div>
            )}

            <div>
              <label className="text-sm text-foreground mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={submit}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>{mode === "login" ? "Signing in..." : "Creating account..."}</span>
                </div>
              ) : mode === "login" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </div>

          {/* Toggle */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => { setMode("signup"); setError("") }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("login"); setError("") }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Image Builder — AI-Powered VM Configuration
        </p>
      </div>
    </div>
  )
}