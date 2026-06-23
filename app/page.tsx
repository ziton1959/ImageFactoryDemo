"use client"

import { useState, useRef, useEffect } from "react"
import { ChatHeader } from "@/components/chat-header"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { WelcomeScreen } from "@/components/welcome-screen"
import { CaptchaGate } from "@/components/captcha-gate"
import { WorkflowSteps, type WorkflowStep } from "@/components/workflow-steps"
import { ImageDownload } from "@/components/image-download"

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
  const [completedSteps, setCompletedSteps] = useState<WorkflowStep[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [imageConfig, setImageConfig] = useState<ImageConfig | null>(null)
  const [buildProgress, setBuildProgress] = useState(0)
  const [imageReady, setImageReady] = useState(false)
  const [currentJobId, setCurrentJobId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const pollJobStatus = async (jobId: number) => {
    setCurrentStep("orchestration")
    setBuildProgress(0)

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`)
        const data = await res.json()

        if (data.status === "running") {
          setBuildProgress(50)
          setMessages(prev => [...prev, {
            id: `build-${Date.now()}`,
            role: "assistant",
            content: `[50%] Building your image...`,
            timestamp: new Date(),
          }])
          setTimeout(poll, 5000)
        } else if (data.status === "completed") {
          setBuildProgress(100)
          completeStep("orchestration")
          setCurrentStep("ready")
          setImageReady(true)
          setMessages(prev => [...prev, {
            id: `ready-${Date.now()}`,
            role: "assistant",
            content: `**Image Build Complete!**\n\nYour VM image has been built and stored.\n\n**Job ID:** ${jobId}\n\nClick the download button below to get your image.`,
            timestamp: new Date(),
            action: "ready",
          }])
          completeStep("ready")
          setCurrentStep("download")
        } else if (data.status === "failed") {
          setMessages(prev => [...prev, {
            id: `failed-${Date.now()}`,
            role: "assistant",
            content: `Build failed: ${data.logs || "Unknown error"}`,
            timestamp: new Date(),
          }])
          setCurrentStep("request")
        } else {
          setTimeout(poll, 5000)
        }
      } catch {
        setTimeout(poll, 5000)
      }
    }

    poll()
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
      if (currentStep === "validation" && imageConfig) {
        const input = content.toLowerCase()
        if (
          input === "yes" ||
          input.includes("confirm") ||
          input.includes("proceed") ||
          input.includes("start") ||
          input.includes("build")
        ) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `**Starting Automated Build Pipeline**\n\nYour configuration has been validated. The orchestration system is now building your image.\n\nThis process typically takes 2-5 minutes...`,
            timestamp: new Date(),
            action: "building",
          }
          setMessages((prev) => [...prev, assistantMessage])
          completeStep("validation")
          setIsLoading(false)
          if (currentJobId) pollJobStatus(currentJobId)
          return
        }
      }

      const response = await fetch("/api/vm/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, owner_id: 1 }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setCurrentJobId(data.job_id)

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
      completeStep("request")
      setCurrentStep("validation")

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `**Configuration Validated**

I've analyzed your request and created the following image specification:

| Parameter | Value |
|-----------|-------|
| **Operating System** | ${spec.os} |
| **vCPU** | ${spec.cpu} cores |
| **Memory** | ${spec.ram_gb} GB RAM |
| **Storage** | 100 GB |
| **Packages** | ${spec.packages.join(", ")} |
| **Security** | CIS Benchmark hardening enabled |
| **Job ID** | ${data.job_id} |
| **VM ID** | ${data.vm_id} |

**Validation Status:** All checks passed ✅

**Type "yes" to confirm and start the automated build**, or describe any changes you'd like to make.`,
        action: "confirm_build",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error processing your request. Please try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  if (currentStep === "captcha" && !completedSteps.includes("captcha")) {
    return <CaptchaGate onVerified={handleCaptchaVerified} />
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader />
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
              <div className="my-4 p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Build Progress</span>
                  <span className="text-sm text-muted-foreground">{buildProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${buildProgress}%` }}
                  />
                </div>
              </div>
            )}

            {imageReady && currentStep === "download" && (
              <ImageDownload
                imageName={`custom-ubuntu-docker-${Date.now().toString().slice(-6)}`}
                imageSize="4.2 GB"
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
      return config ? "Type 'yes' to confirm and start the build, or describe changes..." : "Describe your image requirements..."
    case "orchestration":
      return "Build in progress..."
    case "ready":
    case "download":
      return "Your image is ready! Type a message or start a new build..."
    default:
      return "Type a message..."
  }
}
