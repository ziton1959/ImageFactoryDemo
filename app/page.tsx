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

  const simulateBuildProcess = () => {
    setCurrentStep("orchestration")
    setBuildProgress(0)
    
    const buildSteps = [
      { progress: 10, message: "Selecting base template..." },
      { progress: 25, message: "Provisioning virtual machine..." },
      { progress: 40, message: "Installing operating system..." },
      { progress: 60, message: "Installing packages (Docker, Python)..." },
      { progress: 75, message: "Applying security hardening..." },
      { progress: 90, message: "Running compliance scans..." },
      { progress: 100, message: "Finalizing image..." },
    ]

    let stepIndex = 0
    const interval = setInterval(() => {
      const currentBuildStep = buildSteps[stepIndex]
      if (currentBuildStep) {
        setBuildProgress(currentBuildStep.progress)
        setMessages((prev) => [
          ...prev,
          {
            id: `build-${Date.now()}-${stepIndex}`,
            role: "assistant",
            content: `[${currentBuildStep.progress}%] ${currentBuildStep.message}`,
            timestamp: new Date(),
          },
        ])
        stepIndex++
      } else {
        clearInterval(interval)
        completeStep("orchestration")
        setCurrentStep("ready")
        setImageReady(true)
        
        const imageId = Date.now().toString().slice(-6)
        setMessages((prev) => [
          ...prev,
          {
            id: `ready-${Date.now()}`,
            role: "assistant",
            content: `**Image Build Complete!**

Your custom VM image has been successfully created and registered in the image library.

**Image Details:**
- **Name:** custom-ubuntu-docker-${imageId}
- **Size:** 4.2 GB
- **Format:** OVF/OVA
- **Checksum:** SHA256 verified

Click the download button below to get your image, or you can access it later from the Image Library.`,
            timestamp: new Date(),
            action: "ready",
          },
        ])
        completeStep("ready")
        setCurrentStep("download")
      }
    }, 1500)
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

    // Handle different workflow states
    setTimeout(() => {
      const response = generateResponse(content, currentStep, imageConfig)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        action: response.action,
      }
      
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)

      // Update workflow state based on response
      if (response.newConfig) {
        setImageConfig(response.newConfig)
      }
      
      if (response.nextStep) {
        if (response.nextStep === "validation") {
          completeStep("request")
          setCurrentStep("validation")
        } else if (response.nextStep === "orchestration") {
          completeStep("validation")
          simulateBuildProcess()
        }
      }
    }, 1000)
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

function generateResponse(
  userInput: string, 
  currentStep: WorkflowStep,
  existingConfig: ImageConfig | null
): { content: string; action?: Message["action"]; newConfig?: ImageConfig; nextStep?: WorkflowStep } {
  const input = userInput.toLowerCase()

  // Handle confirmation to start build
  if (currentStep === "validation" && existingConfig) {
    if (input === "yes" || input.includes("confirm") || input.includes("proceed") || input.includes("start") || input.includes("build")) {
      return {
        content: `**Starting Automated Build Pipeline**

Your configuration has been validated and approved. The orchestration system is now building your image.

Please wait while I:
1. Select the appropriate base template
2. Provision the virtual machine
3. Install the operating system
4. Install requested packages
5. Apply security hardening
6. Run compliance scans
7. Register the final image

This process typically takes 2-5 minutes...`,
        action: "building",
        nextStep: "orchestration",
      }
    }
  }

  // Parse request and create config
  if (currentStep === "request" || currentStep === "validation") {
    const newConfig: ImageConfig = {
      os: "Ubuntu",
      version: "22.04 LTS",
      packages: [],
      cpu: 4,
      ram: 8,
      storage: 100,
    }

    if (input.includes("ubuntu")) newConfig.os = "Ubuntu"
    if (input.includes("centos")) newConfig.os = "CentOS"
    if (input.includes("rhel") || input.includes("red hat")) newConfig.os = "RHEL"
    if (input.includes("windows")) newConfig.os = "Windows Server"
    
    if (input.includes("docker")) newConfig.packages.push("Docker CE", "Docker Compose")
    if (input.includes("python")) newConfig.packages.push("Python 3.11", "pip", "virtualenv")
    if (input.includes("node")) newConfig.packages.push("Node.js 20 LTS", "npm")
    if (input.includes("git")) newConfig.packages.push("Git")
    if (input.includes("nginx")) newConfig.packages.push("Nginx")
    if (input.includes("ssh")) newConfig.packages.push("OpenSSH Server")
    
    if (newConfig.packages.length === 0) {
      newConfig.packages.push("Basic utilities", "SSH Server")
    }

    return {
      content: `**Configuration Validated**

I've analyzed your request and created the following image specification:

| Parameter | Value |
|-----------|-------|
| **Operating System** | ${newConfig.os} ${newConfig.version} |
| **Architecture** | x86_64 (AMD64) |
| **vCPU** | ${newConfig.cpu} cores |
| **Memory** | ${newConfig.ram} GB RAM |
| **Storage** | ${newConfig.storage} GB |
| **Packages** | ${newConfig.packages.join(", ")} |
| **Security** | CIS Benchmark hardening enabled |
| **Compliance** | Automated security scan included |

**Validation Status:** All checks passed
- Operating system supported
- Resource allocation valid
- All packages available
- Security policies verified

**Type "yes" to confirm and start the automated build**, or describe any changes you'd like to make.`,
      action: "confirm_build",
      newConfig,
      nextStep: "validation",
    }
  }

  return {
    content: `I understand you want to create a custom VM image. Let me help you configure it.

Please describe:
- **Operating System** (Ubuntu, CentOS, RHEL, Windows Server)
- **Required Software** (Docker, Python, Node.js, etc.)
- **Any specific requirements** (security hardening, compliance needs)

For example: "I need an Ubuntu 22.04 image with Docker and Python for a development environment"`,
  }
}
