import { Button } from "@/components/ui/button"
import { Plus, Menu, Settings } from "lucide-react"
import Image from "next/image"

export function ChatHeader() {
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
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Chat</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>
    </header>
  )
}
