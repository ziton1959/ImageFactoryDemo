"use client"

import { useState, useRef, useEffect } from "react"
import { ChatHeader } from "@/components/chat-header"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { WelcomeScreen } from "@/components/welcome-screen"
import { WorkflowSteps, type WorkflowStep } from "@/components/workflow-steps"
import { ImageDownload } from "@/components/image-download"
import { AuthGate } from "@/components/auth-gate"
import { HistorySidebar } from "@/components/history-sidebar"
import { getToken, saveToken, clearToken } from "@/lib/auth"
import { PanelLeft } from "lucide-react"
import { AdminConsole } from "@/components/admin-console"


const API_BASE = "http://10.202.135.233:8000"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  action?: "confirm_build" | "building" | "ready"
}

interface ImageConfig {
  os: string
  version: string
  packages: string[]
  cpu: number
  ram: number
  storage: number
}

export default function ChatPage() {
  const [token, setToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("request")
  const [currentPhase, setCurrentPhase] = useState<string>("")
  const [completedSteps, setCompletedSteps] = useState<WorkflowStep[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [imageConfig, setImageConfig] = useState<ImageConfig | null>(null)
  const [buildProgress, setBuildProgress] = useState(0)
  const [imageReady, setImageReady] = useState(false)
  const [currentJobId, setCurrentJobId] = useState<number | null>(null)
  const [builtImageName, setBuiltImageName] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [historyRefresh, setHistoryRefresh] = useState(0)

  // Interactive question state
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([])
  const [pendingSpec, setPendingSpec] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const existing = getToken()
    if (existing) {
      setToken(existing)
      setCurrentStep("request")
      // load the current user so we know if they're an admin
      fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${existing}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => setCurrentUser(u))
        .catch(() => {})
    }
  }, [])
  // Admins land on the console automatically
  useEffect(() => {
    if (currentUser?.role === "admin") {
      setShowAdmin(true)
    }
  }, [currentUser])
  const resetChat = () => {
    setMessages([])
    setImageConfig(null)
    setImageReady(false)
    setBuildProgress(0)
    setCurrentPhase("")
    setCurrentJobId(null)
    setBuiltImageName("")
    setIsLoading(false)
    setCompletedSteps([])
    setCurrentStep("request")
    setPendingQuestions([])
    setPendingSpec(null)
  }

  const handleLogout = () => {
    clearToken()
    setToken(null)
    setCurrentUser(null)
    setShowAdmin(false)
    resetChat()
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, pendingQuestions])

  const completeStep = (step: WorkflowStep) => {
    setCompletedSteps((prev) => [...prev, step])
  }

  const addAssistant = (content: string, action?: Message["action"]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: "assistant",
        content,
        timestamp: new Date(),
        action,
      },
    ])
  }

  const addUser = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: "user",
        content,
        timestamp: new Date(),
      },
    ])
  }

  const showConfirmation = (data: any) => {
    const s = data.spec
    setImageConfig({
      os: s.os,
      version: "",
      packages: s.packages,
      cpu: s.cpu,
      ram: s.ram_gb,
      storage: 100,
    })
    setCurrentJobId(data.job_id)
    setBuiltImageName(s.template_name || "")
    completeStep("request")
    setCurrentStep("validation")
    addAssistant(
      `**Configuration Validated**\n\n` +
        `| Parameter | Value |\n|-----------|-------|\n` +
        `| **Operating System** | ${s.os} |\n` +
        `| **vCPU** | ${s.cpu} cores |\n` +
        `| **Memory** | ${s.ram_gb} GB RAM |\n` +
        `| **Packages** | ${s.packages.join(", ") || "none"} |\n` +
        `| **Template** | ${s.template_name} |\n` +
        `| **Job ID** | ${data.job_id} |\n\n` +
        `**Type "yes" to confirm and start the build**, or describe any changes.`,
      "confirm_build",
    )
  }

  const submitCompleteSpec = async (spec: any) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/vm/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: "", partial_spec: spec }),
      })
      const data = await res.json()
      setIsLoading(false)

      if (data.status === "needs_input") {
        setPendingSpec(data.partial_spec)
        setPendingQuestions(data.questions)
        addAssistant(`**${data.questions[0].question}**`)
        return
      }
      if (data.error || data.status === "failed") {
        addAssistant(`Sorry, I couldn't complete that: ${data.error || "unknown error"}`)
        return
      }
      setPendingQuestions([])
      setPendingSpec(null)
      showConfirmation(data)
    } catch {
      setIsLoading(false)
      addAssistant("Sorry, I encountered an error. Please try again.")
    }
  }

  const answerQuestion = async (question: any, value: any) => {
    const updated = { ...pendingSpec }

    if (question.field === "packages_extra") {
      if (value) updated.packages = [...(updated.packages || []), value]
      updated._suggested = true
    } else if (question.type === "package_clarify") {
      updated.packages = (updated.packages || []).filter(
        (p: string) => p.toLowerCase() !== question.package,
      )
      if (value) updated.packages.push(value)
      updated._clarified = [...(updated._clarified || []), question.package]
    } else {
      updated[question.field] = value
    }

    const chosen = question.options.find((o: any) => o.value === value)
    addUser(chosen?.label || String(value))

    const remaining = pendingQuestions.slice(1)
    setPendingSpec(updated)

    if (remaining.length > 0) {
      setPendingQuestions(remaining)
      addAssistant(`**${remaining[0].question}**`)
    } else {
      setPendingQuestions([])
      await submitCompleteSpec(updated)
    }
  }

  const fetchExplanation = async (jobId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/vm/explain/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        addAssistant(`**What went wrong**\n\n${data.explanation}`)
      }
    } catch {
      // silent — the raw log is already shown
    }
  }

  const pollJob = (jobId: number) => {
    setCurrentStep("orchestration")
    setBuildProgress(0)
    let elapsed = 0
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`)
        const job = await res.json()
        setCurrentPhase(job.phase || "")
        const status = job.status
        elapsed += 5
        if (status === "completed") {
          clearInterval(interval)
          setBuildProgress(100)
          completeStep("orchestration")
          setCurrentStep("ready")
          setImageReady(true)
          setHistoryRefresh((k) => k + 1)
          const name = builtImageName || "vm-image"
          setBuiltImageName(name)
          addAssistant(
            `**Image Build Complete**\n\n` +
              `Your VM image was built and stored in the image library.\n\n` +
              `- **Image:** ${name}.qcow2\n` +
              `- **Format:** qcow2\n` +
              `- **Stored in:** vm-images bucket\n\n` +
              `Use the download button below to retrieve it.`,
            "ready",
          )
          completeStep("ready")
          setCurrentStep("download")
        } else if (status === "failed") {
          clearInterval(interval)
          setCurrentStep("validation")
          const err = (job.logs || "").slice(-600)
          addAssistant(
            `**Build Failed**\n\nThe build did not complete. Last log output:\n\n\`\`\`\n${err}\n\`\`\``,
          )
          // fetch an AI explanation
          fetchExplanation(jobId)
        } else {
          setBuildProgress((p) => (p < 90 ? p + 8 : 90))
        }
      } catch (e) {
        if (elapsed > 600) {
          clearInterval(interval)
          setCurrentStep("validation")
          addAssistant(`**Could not reach the build service.** The job may still be running on the server.`)
        }
      }
    }, 5000)
  }

  const handleSendMessage = async (content: string) => {
    addUser(content)
    setIsLoading(true)

    try {
      if (currentStep === "validation" && imageConfig && currentJobId !== null) {
        const input = content.toLowerCase()
        if (
          input === "yes" ||
          input.includes("confirm") ||
          input.includes("proceed") ||
          input.includes("start") ||
          input.includes("build")
        ) {
          addAssistant(
            `**Starting Automated Build Pipeline**\n\nThe orchestration system is building your image (job ${currentJobId}). This typically takes 2-5 minutes...`,
            "building",
          )
          completeStep("validation")
          const buildRes = await fetch(`${API_BASE}/api/vm/build/${currentJobId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          })

          if (!buildRes.ok) {
            // e.g. maintenance mode (503) or other error
            const err = await buildRes.json().catch(() => ({}))
            addAssistant(
              `**Build could not start**\n\n${err.detail || "The build service is unavailable right now. Please try again later."}`,
            )
            setCurrentStep("validation")
            setIsLoading(false)
            return
          }

          pollJob(currentJobId)
          setIsLoading(false)
          return
        }
      }

      const response = await fetch(`${API_BASE}/api/vm/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: content }),
      })
      const data = await response.json()

      if (data.status === "needs_input") {
        setPendingSpec(data.partial_spec)
        setPendingQuestions(data.questions)
        addAssistant(`I need a bit more detail:\n\n**${data.questions[0].question}**`)
        setIsLoading(false)
        return
      }

      if (data.error || data.status === "failed") {
        throw new Error(data.error || "request failed")
      }

      showConfirmation(data)
    } catch (error) {
      addAssistant(`Sorry, I encountered an error processing your request. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthGate
        onAuthenticated={(t, user) => {
          saveToken(t)
          setToken(t)
          if (user) setCurrentUser(user)
          setCurrentStep("request")
        }}
      />
    )
  }

  if (showAdmin && currentUser?.role === "admin") {
    return <AdminConsole currentUser={currentUser} onBackToChat={() => setShowAdmin(false)} />
  }

  return (
    <div className="flex h-screen bg-background">
      <HistorySidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        onSelect={() => {}}
        refreshKey={historyRefresh}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="pl-3 text-muted-foreground hover:text-foreground"
              title="Show history"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <ChatHeader
              onNewChat={resetChat}
              onLogout={handleLogout}
              isAdmin={currentUser?.role === "admin"}
              onOpenAdmin={() => setShowAdmin(true)}
            />
          </div>
        </div>

        <WorkflowSteps currentStep={currentStep} completedSteps={completedSteps} />

        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestionClick={handleSendMessage} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {pendingQuestions.length > 0 && (
                <div className="my-3 flex flex-wrap gap-2">
                  {pendingQuestions[0].options.map((opt: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => answerQuestion(pendingQuestions[0], opt.value)}
                      className="px-4 py-2 rounded-full border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="flex items-center gap-2 py-4">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  </div>
                  <span className="text-muted-foreground text-sm">Processing...</span>
                </div>
              )}

              {currentStep === "orchestration" && <PhaseChecklist current={currentPhase} />}

              {imageReady && currentStep === "download" && (
                <ImageDownload
                  imageName={builtImageName || "vm-image"}
                  imageSize="~900 MB"
                  onDownload={() => completeStep("download")}
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading || currentStep === "orchestration"}
          placeholder={getPlaceholder(currentStep, imageConfig)}
        />
      </div>
    </div>
  )
}

function getPlaceholder(step: WorkflowStep, config: ImageConfig | null): string {
  switch (step) {
    case "request":
      return "Describe the VM image you want to create..."
    case "validation":
      return config
        ? "Type 'yes' to confirm and start the build, or describe changes..."
        : "Describe your image requirements..."
    case "orchestration":
      return "Build in progress..."
    case "ready":
    case "download":
      return "Your image is ready! Type a message or start a new build..."
    default:
      return "Type a message..."
  }
}

const PHASES = [
  { key: "fetching_base", label: "Fetching base image" },
  { key: "booting_vm", label: "Booting VM & configuring resources" },
  { key: "installing_packages", label: "Installing packages" },
  { key: "storing_image", label: "Storing image" },
  { key: "completed", label: "Complete" },
]

function PhaseChecklist({ current }: { current: string }) {
  const currentIdx = PHASES.findIndex((p) => p.key === current)
  const doneCount = current === "completed" ? PHASES.length : Math.max(currentIdx, 0)

  return (
    <div className="my-4 rounded-xl border border-border bg-card p-5 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-foreground">Building your image</span>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
          {Math.min(doneCount, PHASES.length)} of {PHASES.length}
        </span>
      </div>

      <div className="flex flex-col">
        {PHASES.map((p, i) => {
          const done = current === "completed" || (currentIdx > -1 && currentIdx > i)
          const active = currentIdx === i && current !== "completed"
          const isLast = i === PHASES.length - 1

          return (
            <div key={p.key}>
              <div className="flex items-center gap-3 py-1.5">
                {done ? (
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : active ? (
                  <div className="w-7 h-7 shrink-0 relative">
                    <svg className="w-7 h-7" viewBox="0 0 28 28">
                      <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" className="text-border" strokeWidth="2.5" />
                      <circle
                        cx="14" cy="14" r="12" fill="none"
                        stroke="currentColor" className="text-primary"
                        strokeWidth="2.5" strokeLinecap="round" strokeDasharray="30 45"
                        style={{ animation: "spin 1s linear infinite", transformOrigin: "center" }}
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full border-[1.5px] border-dashed border-border flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                  </div>
                )}
                <span
                  className={`text-sm transition-colors duration-300 ${
                    done ? "text-foreground" : active ? "text-foreground font-medium" : "text-muted-foreground/60"
                  }`}
                >
                  {p.label}
                </span>
                {active && <span className="ml-auto text-[11px] text-primary">running…</span>}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-2.5 ml-[13px] transition-colors duration-300 ${
                    done ? "bg-green-600/35" : "bg-border"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
