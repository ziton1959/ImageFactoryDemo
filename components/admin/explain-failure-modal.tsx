"use client"

import { useState, useEffect } from "react"
import { getToken } from "@/lib/auth"
import { Sparkles, X } from "lucide-react"

const API_BASE = "http://10.202.135.233:8000"

export function ExplainFailureModal({ jobId, onClose }: { jobId: number; onClose: () => void }) {
  const [explanation, setExplanation] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/vm/explain/${jobId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setExplanation(d?.explanation || "Could not generate an explanation."))
      .catch(() => setExplanation("Could not reach the analysis service."))
      .finally(() => setLoading(false))
  }, [jobId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Why build #{jobId} failed</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Analyzing the build log…</span>
          </div>
        ) : (
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {explanation}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="text-sm border border-border rounded-lg px-4 py-2 hover:bg-muted/50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
