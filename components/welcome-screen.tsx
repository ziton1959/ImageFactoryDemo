import { Server, Shield, Zap, Package } from "lucide-react"
import Image from "next/image"

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void
}

const suggestions = [
  {
    icon: Server,
    title: "Ubuntu Server",
    description: "Create an Ubuntu 22.04 LTS server image with basic utilities",
    prompt: "I need an Ubuntu 22.04 LTS server image with SSH access enabled",
  },
  {
    icon: Package,
    title: "Docker Ready",
    description: "Build an image with Docker and container tools pre-installed",
    prompt: "Create a Linux image with Docker CE and Docker Compose installed",
  },
  {
    icon: Zap,
    title: "Development Environment",
    description: "Set up a complete dev environment with Python and Node.js",
    prompt: "I want a development image with Python 3.11, Node.js 20, and Git",
  },
  {
    icon: Shield,
    title: "Hardened Security",
    description: "Create a CIS-compliant hardened image for production",
    prompt: "Build a security-hardened Ubuntu image following CIS benchmarks",
  },
]

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="text-center mb-10">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/hpe-logo-clean.png"
            alt="HPE logo"
            width={396}
            height={75}
            className="h-auto w-44 md:w-56 max-w-full object-contain"
            priority
          />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance">
          Build Custom VM Images with AI
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto text-pretty">
          Describe what you need, and I&apos;ll help you configure, validate, and build your custom virtual machine image.
        </p>
      </div>

      <div className="grid gap-3 w-full max-w-2xl sm:grid-cols-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.title}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <suggestion.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                {suggestion.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {suggestion.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>AI-Powered</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          <span>CIS Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          <span>Automated Builds</span>
        </div>
      </div>
    </div>
  )
}
