"use client"

import { useState, useRef, useEffect } from "react"
import { ChatHeader } from "@/components/chat-header"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { WelcomeScreen } from "@/components/welcome-screen"
import { CaptchaGate } from "@/components/captcha-gate"
import { WorkflowSteps, type WorkflowStep } from "@/components/workflow-steps"
import { ImageDownload } from "@/components/image-download"

// Backend base URL — change here if the server IP/port changes.
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
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("captcha")
  const [currentPhase, setCurrentPhase] = useState<string>("")
  const [completedSteps, setCompletedSteps] = useState<WorkflowStep[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [imageConfig, setImageConfig] = useState<ImageConfig | null>(null)
  const [buildProgress, setBuildProgress] = useState(0)
  const [imageReady, setImageReady] = useState(false)
  // The real job id returned by the backend when the build was created.
  const [currentJobId, setCurrentJobId] = useState<number | null>(null)
  const [builtImageName, setBuiltImageName] = useState<string>("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const resetChat = () => {
  setMessages([])
  setImageConfig(null)
  setImageReady(false)
  setBuildProgress(0)
  setCurrentPhase("")
  setCurrentJobId(null)
  setBuiltImageName("")
  setIsLoading(false)
  setCompletedSteps(["captcha"])   // keep captcha passed
  setCurrentStep("request")        // back to the prompt step
}
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const completeStep = (step: WorkflowStep) => {
    setCompletedSteps((prev) => [...prev, step])
  }

  const handleCaptchaVerified = () => {
    completeStep("captcha")
    setCurrentStep("request")
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

  // Poll the real backend job until it finishes or fails.
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

        // Rough visual progress: creeps up while running, full on completion.
        elapsed += 5
        if (status === "completed") {
          clearInterval(interval)

          setBuildProgress(100)
          completeStep("orchestration")
          setCurrentStep("ready")
          setImageReady(true)


          const name = job.template || builtImageName || "vm-image"
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
        } else {
          // still running/queued — nudge the progress bar up to ~90% max
          setBuildProgress((p) => (p < 90 ? p + 8 : 90))
        }
      } catch (e) {
        // network hiccup while polling — keep trying, but cap total wait
        if (elapsed > 600) {
          clearInterval(interval)
          setCurrentStep("validation")
          addAssistant(
            `**Could not reach the build service.** The job may still be running on the server. Check job status manually.`,
          )
        }

      }
    }, 5000)
  }


  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {

      // Confirmation step: build was already created on first submit;
      // here we just start polling the real job.
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
          await fetch(`${API_BASE}/api/vm/build/${currentJobId}`, { method: "POST" })
          pollJob(currentJobId)
          setIsLoading(false)
          return
        }
      }


      // Initial prompt: create the build on the backend.
      const response = await fetch(`${API_BASE}/api/vm/create`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, owner_id: 1 }),
      })

      const data = await response.json()


      if (data.error || data.status === "failed") {
        throw new Error(data.error || "request failed")
      }

      const spec = data.spec
      const newConfig: ImageConfig = {
        os: spec.os,
        version: "",
        packages: spec.packages,
        cpu: spec.cpu,
        ram: spec.ram_gb,
        storage: 100,
      }
      setImageConfig(newConfig)
      setCurrentJobId(data.job_id)
      setBuiltImageName(spec.template_name || "")
      completeStep("request")
      setCurrentStep("validation")


      addAssistant(
        `**Configuration Validated**\n\n` +
          `I parsed your request into this specification:\n\n` +
          `| Parameter | Value |\n` +
          `|-----------|-------|\n` +
          `| **Operating System** | ${spec.os} |\n` +
          `| **vCPU** | ${spec.cpu} cores |\n` +
          `| **Memory** | ${spec.ram_gb} GB RAM |\n` +
          `| **Packages** | ${spec.packages.join(", ") || "none"} |\n` +
          `| **Template** | ${spec.template_name} |\n` +
          `| **Job ID** | ${data.job_id} |\n` +
          `| **VM ID** | ${data.vm_id} |\n\n` +
          `**Type "yes" to confirm and start the build**, or describe any changes.`,
        "confirm_build",
      )
    } catch (error) {
      addAssistant(
        `Sorry, I encountered an error processing your request. Please try again.`,
      )

    } finally {
      setIsLoading(false)
    }
  }

  if (currentStep === "captcha" && !completedSteps.includes("captcha")) {
    return <CaptchaGate onVerified={handleCaptchaVerified} />
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader onNewChat={resetChat} />
      <WorkflowSteps currentStep={currentStep} completedSteps={completedSteps} />

      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={handleSendMessage} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 py-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                </div>
                <span className="text-muted-foreground text-sm">Processing...</span>
              </div>
            )}

            {currentStep === "orchestration" && (
              <PhaseChecklist current={currentPhase} />
            )}

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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Building your image</span>
        </div>
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
                {/* status circle */}
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
                        stroke="currentColor" className="text-primary origin-center"
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

                {/* label */}
                <span
                  className={`text-sm transition-colors duration-300 ${
                    done ? "text-foreground" : active ? "text-foreground font-medium" : "text-muted-foreground/60"
                  }`}
                >
                  {p.label}
                </span>

                {/* right-side status */}
                {active && (
                  <span className="ml-auto text-[11px] text-primary">running…</span>
                )}
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

